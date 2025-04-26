import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, firestore, db } from '@/config/firebase'
import { ref as dbRef, push, onValue, update, set, serverTimestamp } from 'firebase/database'
import { doc, setDoc, updateDoc, onSnapshot, getDoc, collection } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import type { GameRoom, GameState, MatchRequest } from '@/types/game'
import type { Team, Position, BoardPlayerPosition } from '@/types/gameRoom'
import { initializeGameState } from '@/utils/gameInitializer'

// Store and utility imports
import { useGameStore } from './game'
import { parsePosition } from './game'

// Explicitly export parsePosition
export { parsePosition }

// Utility functions for game state management
function getAdjacentPlayers(players: BoardPlayerPosition[], position: Position): BoardPlayerPosition[] {
  return players.filter(player => {
    const rowDiff = Math.abs(player.position.row - position.row)
    const colDiff = Math.abs(player.position.col - position.col)
    return (rowDiff <= 1 && colDiff <= 1)
  })
}

function checkGoal(ballPosition: Position): 'blue' | 'red' | null {
  if (ballPosition.row === -1) return 'blue'
  if (ballPosition.row === 16) return 'red'
  return null
}

function endTurn(currentTeam: Team): Team {
  return currentTeam === 'blue' ? 'red' : 'blue'
}

// New method to fetch and restore game room state
async function restoreGameRoomState(roomId: string) {
  try {
    if (!auth.currentUser) {
      console.error('User not authenticated')
      return null
    }

    const roomRef = doc(firestore, 'gameRooms', roomId)
    const roomSnapshot = await getDoc(roomRef)

    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.data() as GameRoom
      return roomData
    } else {
      console.error('❌ Game room not found during restoration')
      return null
    }
  } catch (error) {
    console.error('Error restoring game room state:', error)
    return null
  }
}

export const useGameRoomStore = defineStore('gameRoom', () => {
  // Initialize router
  const router = useRouter()

  // State
  const currentRoom = ref<GameRoom | null>(null)
  const matchmakingStatus = ref<'idle' | 'searching' | 'joining' | 'in_game'>('idle')
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


  // Safe getter for game state
  function getGameState(): GameState {
    if (!currentRoom.value?.gameState) {
      // Return a default game state if no game state exists
      return initializeGameState()
    }
    return currentRoom.value.gameState as GameState
  }

  // Convert string coordinate (e.g., '3B') to [row, col]
  function parseCoordinate(coord: string): [number, number] {
    const row = parseInt(coord.charAt(0)) - 1
    const col = coord.charAt(1).charCodeAt(0) - 65
    return [row, col]
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

      // Ensure the current user is added to the players object
      const updatedPlayers = {
        ...gameRoom.players,
        [auth.currentUser.uid]: {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Player',
          team: Object.keys(gameRoom.players).length === 0 ? 'blue' : 'red'
        }
      }

      // Create a new game room in Firestore
      const gameRoomsRef = collection(firestore, 'gameRooms')
      const roomRef = doc(gameRoomsRef)
      const newRoomData = {
        ...gameRoom,
        id: roomRef.id, // Update with generated ID
        players: updatedPlayers, // Use updated players object
        gameState: initializeGameState()
      }
      await setDoc(roomRef, newRoomData)

      // Set up game store data
      const gameStore = useGameStore()
      gameStore.$reset() // Reset the store to initial state

      const store = useGameStore()

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
        },
        timerConfig: {
          ...(gameRoom.settings.mode === 'timed' && { gameDuration: gameRoom.settings.duration || 0 })
        }
      })

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
        const queueRef = dbRef(db, 'matchmaking')
        const newRequestRef = await push(queueRef, request)

        // Listen for match
        const matchRef = dbRef(db, `matches/${auth.currentUser.uid}`)

        // First, clear any existing match data
        await set(matchRef, null)

        const unsubscribe = onValue(matchRef, async (snapshot) => {
          const match = snapshot.val()

          if (match === null) {
            return
          }

          if (match?.roomId) {
            // Found a match, clean up listener
            unsubscribe()

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

      matchmakingStatus.value = 'joining'
      error.value = null

      const roomRef = doc(firestore, 'gameRooms', roomId)
      const roomSnap = await getDoc(roomRef)

      if (!roomSnap.exists()) {
        throw new Error('Room not found')
      }

      const roomData = roomSnap.data() as GameRoom
      const playerIds = Object.keys(roomData.players)

      // Check if room is full
      if (playerIds.length >= 2 && !playerIds.includes(auth.currentUser.uid)) {
        throw new Error('Room is already full')
      }

      // Prepare player data
      const playerData = {
        uid: auth.currentUser.uid,
        phoneNumber: auth.currentUser.phoneNumber || '',
        displayName: auth.currentUser.displayName || auth.currentUser.phoneNumber || '',
        color: playerIds.length === 0 ? 'blue' : 'red',
        ready: true,
        score: 0
      }

      // Update room with new player
      const updatedPlayers = {
        ...roomData.players,
        [auth.currentUser.uid]: playerData
      }

      // Update Firestore document
      await updateDoc(roomRef, {
        players: updatedPlayers,
        gameState: initializeGameState(),
        status: Object.keys(updatedPlayers).length === 2 ? 'ready' : 'waiting',
        updatedAt: Date.now()
      })

      // Use the game store to initialize players
      const store = useGameStore()

      // Initialize the game with the selected formation
      store.initializeGame()
      // Listen for room updates
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const updatedRoomData = doc.data() as GameRoom
          currentRoom.value = {
            ...updatedRoomData,
            id: doc.id
          }
        }
      })

      matchmakingStatus.value = 'in_game'
      return roomId
    } catch (e) {
      console.error('❌ Join room error:', e)
      error.value = (e as Error).message
      matchmakingStatus.value = 'idle'
      throw e
    }
  }

  async function makeMove(from: [number, number], to: [number, number], type: string) {
    try {
      // Ensure current user is in the room
      if (!currentRoom.value || !auth.currentUser) {
        console.error('Cannot make move: No current room or user')
        return
      }

      // Check if current user is a player in the room
      const playerIds = Object.keys(currentRoom.value.players)
      if (!playerIds.includes(auth.currentUser.uid)) {
        console.error('User is not a player in this room')
        return
      }

      const roomRef = doc(firestore, 'gameRooms', currentRoom.value.id)
      const gameState = getGameState() // Use safe getter

      function toNotation(row: number, col: number): string {
        const colLetter = String.fromCharCode('a'.charCodeAt(0) + col);
        return `${row + 1}${colLetter}`;
      }
      const fromNotation = toNotation(from[0], from[1]);
      const toNotationStr = toNotation(to[0], to[1]);

      // Deep clone the board to avoid mutating the original state
      const updatedBoard = JSON.parse(JSON.stringify(gameState.board));

      if (type === "player") {
        // Find and move the player
        let found = false;
        for (const team of ['blue', 'red']) {
          for (const role of ['G', 'D', 'M', 'F']) {
            const idx = updatedBoard[team][role].indexOf(fromNotation);
            if (idx !== -1) {
              updatedBoard[team][role].splice(idx, 1); // Remove from old position
              updatedBoard[team][role].push(toNotationStr); // Add to new position
              found = true;
              break;
            }
          }
          if (found) break;
        }
      } else if (type === "ball") {
        // Move the ball
        if (updatedBoard.ball && fromNotation === updatedBoard.ball.toLowerCase()) {
          updatedBoard.ball = toNotationStr;
        }
      }
      gameState.board = updatedBoard;

      // Prepare the update object with comprehensive game state
      const move = {
        from,
        to,
        player: auth.currentUser.uid, //TODO: use color
        timestamp: Date.now()
      }

      const updateData: Record<string, any> = {
        'gameState': gameState,
        'gameState.board': gameState.board,
        'gameState.moves': gameState.moves.concat(move),
        'gameState.currentTurn': getNextTurnPlayer(),
        'gameState.timestamp': Date.now(),
        updatedAt: Date.now()
      }

      // Atomic update to ensure consistency
      await updateDoc(roomRef, updateData)

      // Optional: Additional validation or logging
      const updatedDoc = await getDoc(roomRef)
      if (updatedDoc.exists()) {
        const docData = updatedDoc.data()
      }
    } catch (error) {
      console.error('Error making move:', error)
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
    restoreGameRoomState,

    // Utility methods
    getAdjacentPlayers: () => getAdjacentPlayers,
    checkGoal: () => checkGoal,
    endTurn: () => endTurn
  }
})
