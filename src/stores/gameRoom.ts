import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, firestore, db } from '@/config/firebase'
import { ref as dbRef, push, onValue, update, set, serverTimestamp } from 'firebase/database'
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import type { GameRoom, MatchRequest, Formation } from '@/types/game'
import { FORMATIONS } from '../types/formations'
import { initializeGameState } from '@/utils/gameInitializer'

export const useGameRoomStore = defineStore('gameRoom', () => {
  // Initialize router
  const router = useRouter()

  // State
  const currentRoom = ref<GameRoom | null>(null)
  const matchmakingStatus = ref<'idle' | 'searching' | 'joining' | 'creating'>('idle')
  const error = ref<string | null>(null)

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
    return parseBoard(currentRoom.value.gameState.board)
  })

  // Actions
  async function findMatch(preferences: { mode: 'timed' | 'race', duration?: number, goalTarget?: number }) {
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
          duration: preferences.duration,
          goalTarget: preferences.goalTarget
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
          console.log('🎯 Match found! Room ID:', match.roomId)
          // Found a match, clean up listener
          unsubscribe()
          
          console.log('🚪 Joining room...')
          const roomId = await joinRoom(match.roomId)
          console.log('✨ Successfully joined room:', roomId)
          
          // Clear the match data after joining
          await set(matchRef, null)
          router.push(`/game/${roomId}`)
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
        throw new Error('Room does not exist')
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

  async function createRoom(config: { mode: 'timed' | 'race', duration?: number, goalTarget?: number }) {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated')
      }

      matchmakingStatus.value = 'creating'
      error.value = null

      // Create a new room in Firestore
      const roomRef = doc(collection(firestore, 'gameRooms'))
      
      // Prepare player data
      const playerData = {
        uid: auth.currentUser.uid,
        phoneNumber: auth.currentUser.phoneNumber,
        displayName: auth.currentUser.displayName || 'Player',
        color: 'blue',
        ready: false,
        score: 0
      }

      // Determine default formation
      const defaultFormation = getDefaultFormation()

      // Prepare initial game state
      const initialGameState = createInitialGameBoard(defaultFormation)

      // Prepare room data
      const roomData = {
        players: { [auth.currentUser.uid]: playerData },
        gameState: initialGameState,
        settings: {
          mode: config.mode,
          duration: config.duration,
          goalTarget: config.goalTarget
        },
        status: 'waiting',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Save the room
      await setDoc(roomRef, roomData)

      // Set up a match request
      const matchRef = dbRef(db, `matchRequests/${auth.currentUser.uid}`)
      await set(matchRef, {
        uid: auth.currentUser.uid,
        phoneNumber: auth.currentUser.phoneNumber,
        timestamp: Date.now(),
        preferences: {
          mode: config.mode,
          duration: config.duration,
          goalTarget: config.goalTarget
        }
      })

      // Listen for another player joining
      const unsubscribe = onSnapshot(roomRef, async (doc) => {
        if (doc.exists()) {
          const roomData = doc.data() as GameRoom
          const playerIds = Object.keys(roomData.players)
          
          // If two players have joined, start the game
          if (playerIds.length === 2) {
            await updateDoc(roomRef, {
              status: 'in_progress',
              'gameState.currentTurn': playerIds[0],
              'gameState.startTime': Date.now(),
              'gameState.timestamp': Date.now()
            })
            
            // Navigate to the game with the room ID
            router.push(`/game/${doc.id}`)
            
            // Clear the match data after joining
            await set(matchRef, null)
          }
        }
      })

      matchmakingStatus.value = 'idle'

      return roomRef.id
    } catch (e) {
      console.error('❌ Create room error:', e)
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
      const updateData: Record<string, any> = {
        'gameState.board': currentRoom.value.gameState.board, // Updated board state
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
    
    // Getters
    isInRoom,
    isMyTurn,
    myScore,
    boardState,
    
    // Actions
    findMatch,
    joinRoom,
    createRoom,
    makeMove,
    leaveRoom
  }
})
