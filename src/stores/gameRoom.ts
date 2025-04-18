import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, firestore, db } from '@/config/firebase'
import { ref as dbRef, push, onValue, update, set, serverTimestamp } from 'firebase/database'
import { doc, setDoc, updateDoc, onSnapshot, getDoc, collection } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import type { GameRoom, MatchRequest, Team, Position, Player, PlayerRole } from '@/types/game'
import type { Formation } from '@/types/formations'
import { useGameStore } from './game'
import { createPlayer, parsePosition } from './game'
import { initializeGameState } from '@/utils/gameInitializer'
import { FORMATIONS } from '@/types/formations'

// Utility functions for game state management
function getAdjacentPlayers(players: Player[], position: Position): Player[] {
  return players.filter(player => {
    const rowDiff = Math.abs(player.position.row - position.row)
    const colDiff = Math.abs(player.position.col - position.col)
    return (rowDiff <= 1 && colDiff <= 1)
  })
}

function getBallMoves(player: Player, ballPosition: Position): Position[] {
  const moves: Position[] = []
  const { row, col } = ballPosition

  // Implement movement logic for different roles
  switch (player.role) {
    case 'goalkeeper':
      // Goalkeeper limited movement
      break
    case 'defender':
      // Defender movement logic
      break
    case 'midfielder':
      // Midfielder can move more freely
      break
    case 'forward':
      // Forward has more aggressive movement
      break
  }

  return moves
}

function checkGoal(ballPosition: Position): 'blue' | 'red' | null {
  if (ballPosition.row === -1) return 'blue'
  if (ballPosition.row === 16) return 'red'
  return null
}

function endTurn(currentTeam: Team): Team {
  return currentTeam === 'blue' ? 'red' : 'blue'
}


export const useGameRoomStore = defineStore('gameRoom', () => {
  // Initialize router
  const router = useRouter()

  // State
  const currentRoom = ref<GameRoom | null>(null)
  const matchmakingStatus = ref<'idle' | 'searching' | 'joining' | 'creating'>('idle')
  const error = ref<string | null>(null)

  // Game state management
  const gamePhase = ref<'PLAYER_SELECTION' | 'PLAYER_MOVEMENT' | 'BALL_MOVEMENT' | 'GAME_OVER'>('BALL_MOVEMENT')
  const currentTeam = ref<Team>('blue')
  const ballPosition = ref<Position>({ row: 8, col: 5 })
  const selectedPlayerId = ref<string | null>(null)
  const isBallSelected = ref(false)
  const validMoves = ref<Position[]>([])  
  const isFirstMove = ref(true)
  const score = ref({ blue: 0, red: 0 })
  const winner = ref<Team | null>(null)
  const canCaptainMoveAgain = ref(false)

  // Utility function to parse board
  function parseBoard(board: number[][] | string): number[][] {
    if (Array.isArray(board)) return board
    try {
      return JSON.parse(board as string)
    } catch {
      // Return empty board if parsing fails
      return Array(8).fill(null).map(() => Array(8).fill(null))
    }
  }

  // Safe getter for game state
  function getGameState() {
    if (!currentRoom.value) {
      throw new Error('No current game room')
    }
    return currentRoom.value.gameState || initializeGameState(getDefaultFormation())
  }

  // Convert string coordinate (e.g., '3B') to [row, col]
  function parseCoordinate(coord: string): [number, number] {
    const row = parseInt(coord.charAt(0)) - 1
    const col = coord.charAt(1).charCodeAt(0) - 65
    return [row, col]
  }

  // Utility function to find default formation
  function getDefaultFormation(): string {
    const defaultFormation = FORMATIONS.find(f => f.default)
    return defaultFormation ? defaultFormation.name : FORMATIONS[0].name
  }

  // Utility function to create initial game board
  function createInitialGameBoard(formationName: string): {
    blue: {
      G: string[];
      D: string[];
      M: string[];
      F: string[];
    };
    red: {
      G: string[];
      D: string[];
      M: string[];
      F: string[];
    };
    goals: {
      blue: string[];
      red: string[];
    };
    board: number[][];
  } {
    const formation = FORMATIONS.find(f => f.name === formationName)
    if (!formation) {
      throw new Error(`Formation ${formationName} not found`)
    }

    // Create initial board structure matching the GameState type
    const initialBoard = Array(8).fill(null).map(() => Array(8).fill(null))
    formation.positions.G.forEach((coord) => {
      const [row, col] = parseCoordinate(coord)
      initialBoard[row][col] = 'G'
    })
    formation.positions.D.forEach((coord) => {
      const [row, col] = parseCoordinate(coord)
      initialBoard[row][col] = 'D'
    })
    formation.positions.M.forEach((coord) => {
      const [row, col] = parseCoordinate(coord)
      initialBoard[row][col] = 'M'
    })
    formation.positions.F.forEach((coord) => {
      const [row, col] = parseCoordinate(coord)
      initialBoard[row][col] = 'F'
    })

    return {
      blue: {
        G: formation.positions.G,
        D: formation.positions.D,
        M: formation.positions.M,
        F: formation.positions.F
      },
      red: {
        G: formation.positions.G,
        D: formation.positions.D,
        M: formation.positions.M,
        F: formation.positions.F
      },
      goals: {
        blue: [],
        red: []
      },
      board: initialBoard
    }
  }
  function getBallMoves(player: Player): Position[] {
    // Implement ball movement logic similar to single-player game
    const moves: Position[] = []
    const { row, col } = ballPosition.value

    // Implement movement logic for different roles
    switch (player.role) {
      case 'goalkeeper':
        // Goalkeeper limited movement
        break
      case 'defender':
        // Defender movement logic
        break
      case 'midfielder':
        // Midfielder can move more freely
        break
      case 'forward':
        // Forward has more aggressive movement
        break
    }

    return moves
  }

  // Getters
  const isInRoom = computed(() => currentRoom.value !== null)
  const isMyTurn = computed(() => {
    if (!currentRoom.value?.gameState || !auth.currentUser) return false
    return currentRoom.value.gameState.currentTurn === auth.currentUser.uid
  })
  const myScore = computed(() => {
    if (!currentRoom.value || !auth.currentUser) return 0
    return currentRoom.value.players[auth.currentUser.uid]?.score || 0
  })
  const boardState = computed(() => {
    if (!currentRoom.value?.gameState) return Array(8).fill(null).map(() => Array(8).fill(null))

    // Convert complex board object to 2D number array
    const board = Array(8).fill(null).map(() => Array(8).fill(null))

    // Helper function to place pieces
    const placePieces = (color: 'blue' | 'red', pieces: { G: string[], D: string[], M: string[], F: string[] }) => {
      const pieceTypes = { G: 1, D: 2, M: 3, F: 4 }
      Object.entries(pieces).forEach(([type, coords]) => {
        coords.forEach(coord => {
          const [row, col] = parseCoordinate(coord)
          board[row][col] = pieceTypes[type as keyof typeof pieceTypes] * (color === 'blue' ? 1 : -1)
        })
      })
    }

    const gameState = currentRoom.value.gameState
    if (gameState?.board?.blue && gameState?.board?.red) {
      placePieces('blue', gameState.board.blue)
      placePieces('red', gameState.board.red)
    }

    return board
  })

  // Actions
  async function createGameRoom(gameRoom: GameRoom): Promise<string> {
    try {
      if (!auth.currentUser) {
        console.error('❌ User not authenticated')
        throw new Error('User not authenticated')
      }

      // Create a new game room in Firestore
      const gameRoomsRef = collection(firestore, 'gameRooms')
      const roomRef = doc(gameRoomsRef)
      const newRoomData = {
        ...gameRoom,
        id: roomRef.id, // Update with generated ID
        gameState: initializeGameState(gameRoom.settings.formation || getDefaultFormation())
      }
      await setDoc(roomRef, newRoomData)

      // Update the current room
      currentRoom.value = {
        ...newRoomData,
        gameState: newRoomData.gameState
      }

      console.log('✅ Game room created with ID:', roomRef.id)

      // Set up game store data
      const gameStore = useGameStore()
      gameStore.$reset() // Reset the store to initial state
      // Find the default formation
      // Robust formation selection
      const defaultFormation = FORMATIONS.find(f => f.default)?.name || FORMATIONS[0].name
      let selectedFormation = gameRoom.settings.formation

      // Handle numeric formation selection (convert index to name)
      if (typeof selectedFormation === 'number') {
        selectedFormation = FORMATIONS[selectedFormation]?.name || defaultFormation
      }

      const formationConfig = FORMATIONS.find(f => f.name === selectedFormation) || 
                               FORMATIONS.find(f => f.default) || 
                               FORMATIONS[0]
      
      console.log('🏆 Detailed Formation Selection:', {
        gameRoomFormation: gameRoom.settings.formation,
        gameRoomSettings: gameRoom.settings,
        defaultFormation,
        selectedFormation,
        formationConfig: formationConfig.name,
        availableFormations: FORMATIONS.map(f => f.name),
        formationConfigDetails: formationConfig
      })
      
      console.log('🧩 Player Creation Debug:', {
        playersCount: Object.entries(gameRoom.players).length,
        playerData: gameRoom.players
      })

      // Ensure selectedFormation is a string name
      const safeSelectedFormation = typeof selectedFormation === 'number' 
        ? FORMATIONS[selectedFormation]?.name || FORMATIONS[0].name 
        : (selectedFormation || FORMATIONS[0].name)

      // Use the game store to initialize players
      const store = useGameStore()
      
      // Set the formation in the game store
      store.setFormation(safeSelectedFormation)
      
      // Initialize the game with the selected formation
      store.initializeGame()

      // Patch game configuration
      store.$patch({
        gameConfig: {
          opponent: Object.keys(gameRoom.players).length > 1 ? 'online' : 'local',
          mode: gameRoom.settings.mode,
          duration: gameRoom.settings.duration || 0,
          goalTarget: gameRoom.settings.goalTarget || 0,
          goalGap: gameRoom.settings.goalGap || 0,
          formation: safeSelectedFormation
        },
        timerConfig: {
          ...(gameRoom.settings.mode === 'timed' && { gameDuration: gameRoom.settings.duration || 0 })
        }
      })

      console.log('🚀 Initialized Players:', store.players)
      //   }
      // })

      return roomRef.id
    } catch (error) {
      console.error('❌ Error creating game room:', error)
      throw error
    }
  }

  async function findMatch(preferences: { mode: 'timed' | 'race' | 'gap', duration?: number, goalTarget?: number, goalGap?: number }): Promise<string> {
    return new Promise(async (resolve, reject) => {
      console.error('🚨 DEBUGGING: findMatch CALLED with preferences:', preferences)
      try {
        if (!auth.currentUser?.phoneNumber) {
          console.error('❌ User not authenticated')
          throw new Error('User not authenticated')
        }

        matchmakingStatus.value = 'searching'
        error.value = null

        // Create base request with required fields
        const request: MatchRequest = {
          uid: auth.currentUser.uid,
          phoneNumber: auth.currentUser.phoneNumber,
          timestamp: Date.now(),
          preferences: {
            mode: preferences.mode,
            ...(preferences.duration && { duration: preferences.duration }),
            ...(preferences.goalTarget && { goalTarget: preferences.goalTarget }),
            ...(preferences.goalGap && { goalGap: preferences.goalGap })
          }
        }

        console.error('🚨 DEBUGGING: Matchmaking request created:', JSON.stringify(request, null, 2))

        // Remove undefined values
        if (request.preferences.duration === undefined) {
          delete request.preferences.duration
        }

        if (request.preferences.goalTarget === undefined) {
          delete request.preferences.goalTarget
        }

        // Create a new request in the matchmaking queue
        console.log('📝 Creating matchmaking request...')
        const queueRef = dbRef(db, 'matchmaking')
        const newRequestRef = await push(queueRef, request)
        console.log('✅ Request registered with ID:', newRequestRef.key)

        // Listen for match
        console.log('👀 Listening for match at:', `matches/${auth.currentUser.uid}`)
        const matchRef = dbRef(db, `matches/${auth.currentUser.uid}`)
        console.log('🔍 Setting up match listener at:', matchRef.toString())

        // First, clear any existing match data
        await set(matchRef, null)

        const unsubscribe = onValue(matchRef, async (snapshot) => {
          const match = snapshot.val()
          console.log('📨 Received match update:', match)

          if (match === null) {
            console.log('⏳ Waiting for match...')
            return
          }

          if (match?.roomId) {
            console.log('★ Match found! Room ID:', match.roomId)
            // Found a match, clean up listener
            unsubscribe()

            console.log('✨ Successfully joined room:', match.roomId)

            // Attempt to join the room
            await joinRoom(match.roomId)

            // Clear the match data after joining
            await set(matchRef, null)
            resolve(match.roomId)
          } else {
            console.log('❗ Match found without room ID, waiting...')
          }
        })

        // Clean up if component is unmounted
        console.log('🔄 Setting up cleanup for page unload...')
        const cleanup = async () => {
          console.log('🗑 Cleaning up matchmaking...')
          unsubscribe()
          await set(newRequestRef, null)
          await set(matchRef, null)
          matchmakingStatus.value = 'idle'
        }

        // Set up cleanup for page unload
        window.addEventListener('beforeunload', cleanup)

        // Set up cleanup for errors
        window.addEventListener('error', async () => {
          unsubscribe()
          await set(newRequestRef, null)
          await set(matchRef, null)
        })
      } catch (e) {
        console.error('❌ Matchmaking error:', e)
        error.value = (e as Error).message
        matchmakingStatus.value = 'idle'
        throw e
      }

      // This is a fallback to satisfy TypeScript
      return ''
    })
  }

  async function joinRoom(roomId: string) {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      console.log(`🔍 Attempting to join room: ${roomId}`)
      matchmakingStatus.value = 'joining'
      error.value = null

      const roomRef = doc(firestore, 'gameRooms', roomId)
      const roomSnap = await getDoc(roomRef)

      console.log('🚪 Room Snapshot:', {
        exists: roomSnap.exists(),
        data: roomSnap.data()
      })

      if (!roomSnap.exists()) {
        console.error(`❌ Room ${roomId} does not exist`)
        throw new Error('ROOM_NOT_FOUND')
      }

      const roomData = roomSnap.data() as GameRoom
      const playerIds = Object.keys(roomData.players)

      console.log('🏠 Room Data:', {
        roomId,
        status: roomData.status,
        players: playerIds,
        currentUser: auth.currentUser.uid
      })

      // Check if room is full or game is already in progress
      if (playerIds.length >= 2) {
        if (roomData.status === 'in_progress' && !playerIds.includes(auth.currentUser.uid)) {
          console.error('❌ Room is full or game is in progress')
          throw new Error('Room is full or game is in progress')
        }
      }

      // Prepare player data for the second player
      const playerData = {
        uid: auth.currentUser.uid,
        phoneNumber: auth.currentUser.phoneNumber,
        displayName: auth.currentUser.displayName || 'Player',
        color: playerIds.length === 0 ? 'blue' : 'red',
        ready: false,
        score: 0
      }

      // Update room with new player
      await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}`]: playerData,
        updatedAt: Date.now()
      })

      // If two players have joined, update room status
      if (Object.keys(roomData.players).length + 1 === 2) {
        await updateDoc(roomRef, {
          status: 'in_progress',
          'gameState.currentTurn': playerIds[0] || auth.currentUser.uid,
          'gameState.startTime': Date.now(),
          'gameState.timestamp': Date.now()
        })
      }

      // Navigate to the game URL
      router.push(`/game/${roomId}`)

      // Listen for room updates
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const updatedRoomData = doc.data() as GameRoom

          // Ensure the room data has an ID
          const roomWithId = {
            ...updatedRoomData,
            id: doc.id
          }

          // Update the current room
          currentRoom.value = roomWithId
          console.log('🔄 Room Updated:', currentRoom.value)
        }
      })

      matchmakingStatus.value = 'idle'
      return roomId
    } catch (e) {
      console.error('❌ Join room error:', e)
      error.value = (e as Error).message
      matchmakingStatus.value = 'idle'
      throw e
    }
  }


  async function makeMove(from: [number, number], to: [number, number]) {
    try {
      if (!currentRoom.value || !auth.currentUser || !isMyTurn.value) return

      const roomRef = doc(firestore, 'gameRooms', currentRoom.value.id)

      // Prepare the update object with only the fields that need to change
      const gameState = getGameState() // Use safe getter
      const updateData: Record<string, any> = {
        'gameState.board': gameState.board, // Updated board state
        'gameState.currentTurn': getNextTurnPlayer(),
        'gameState.lastMove': { from, to },
        'gameState.timestamp': Date.now(),
        updatedAt: Date.now()
      }

      await updateDoc(roomRef, updateData)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  function getNextTurnPlayer(): string {
    if (!currentRoom.value || !auth.currentUser) return ''

    const playerIds = Object.keys(currentRoom.value.players)
    const currentIndex = playerIds.indexOf(auth.currentUser.uid)
    return playerIds[(currentIndex + 1) % playerIds.length]
  }

  async function leaveRoom() {
    try {
      if (!currentRoom.value || !auth.currentUser) return

      const roomRef = doc(firestore, 'gameRooms', currentRoom.value.id)
      await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}`]: null,
        updatedAt: Date.now()
      })

      currentRoom.value = null
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  return {
    // State
    currentRoom,
    matchmakingStatus,
    error,
    gamePhase,
    currentTeam,
    ballPosition,
    selectedPlayerId,
    isBallSelected,
    validMoves,
    isFirstMove,
    score,
    winner,
    canCaptainMoveAgain,

    // Getters
    isInRoom,
    isMyTurn,
    myScore,
    boardState,

    // Actions
    findMatch,
    joinRoom,
    makeMove,
    getNextTurnPlayer,
    leaveRoom,
    createGameRoom,

    // Utility methods
    getAdjacentPlayers: () => getAdjacentPlayers,
    getBallMoves: () => getBallMoves,
    checkGoal: () => checkGoal,
    endTurn: () => endTurn
  }
})
