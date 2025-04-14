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
  const matchmakingStatus = ref<'idle' | 'searching' | 'joining'>('idle')
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
  function createInitialGameBoard(formationName: string): number[][] {
    const formation = FORMATIONS.find(f => f.name === formationName)
    if (!formation) {
      throw new Error(`Formation ${formationName} not found`)
    }
    const gameState = initializeGameState(formation.name)
    return gameState.board
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
          router.push('/game')
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
      console.log('🚪 Attempting to join room:', roomId)
      
      if (!auth.currentUser?.phoneNumber) {
        console.error('❌ User not authenticated')
        throw new Error('User not authenticated')
      }
      
      matchmakingStatus.value = 'joining'
      error.value = null

      // Join the room in Firestore
      const roomRef = doc(firestore, 'gameRooms', roomId)
      
      // Determine player color
      const updatedRoom = await getDoc(roomRef)
      const roomData = updatedRoom.data()
      const existingPlayers = roomData?.players || {}
      const playerIds = Object.keys(existingPlayers)
      
      // Assign color based on join order
      const playerColor = playerIds.length === 0 ? 'blue' : 'red'

      console.log('🎨 Assigned player color:', playerColor)
      console.log('👥 Existing players:', playerIds)

      // Prepare player data
      const playerData = {
        uid: auth.currentUser.uid,
        phoneNumber: auth.currentUser.phoneNumber,
        displayName: auth.currentUser.displayName || 'Player',
        color: playerColor,
        ready: false,
        score: 0
      }

      console.log('👤 Player data:', JSON.stringify(playerData))

      // Prepare updated players object
      const updatedPlayers = {
        ...existingPlayers,
        [auth.currentUser.uid]: playerData
      }

      // Debug logging for FORMATIONS import
      console.error('🔍 FORMATIONS Import:', FORMATIONS)
      console.error('🔍 FORMATIONS Keys:', Object.keys(FORMATIONS))
      console.error('🔍 FORMATIONS Entries:', JSON.stringify(Object.entries(FORMATIONS), null, 2))

      // Initialize board with starting positions
      let defaultFormation
      try {
        defaultFormation = getDefaultFormation()
        console.error('🏁 Default Formation Found:', defaultFormation)
      } catch (formationError) {
        console.error('❌ Error getting default formation:', formationError)
        
        // Fallback mechanism
        const firstFormation = Object.values(FORMATIONS)[0]
        console.error('🚨 Using first available formation:', JSON.stringify(firstFormation, null, 2))
        defaultFormation = firstFormation.name
      }

      const initialBoard = createInitialGameBoard(defaultFormation)

      // Prepare game state
      const gameState = {
        board: initialBoard,
        currentTurn: playerIds.length === 0 ? auth.currentUser.uid : null,
        lastMove: null,
        timestamp: Date.now(),
        formation: defaultFormation  // Store formation name
      }

      // Prepare settings with default values
      const settings = {
        mode: roomData?.settings?.mode || 'timed',
        duration: roomData?.settings?.duration || 300, // default 5 minutes
        goalTarget: roomData?.settings?.goalTarget || 10 // default goal target
      }

      // Join the room
      await setDoc(roomRef, {
        players: updatedPlayers,
        gameState: gameState,
        settings: settings,
        status: playerIds.length === 1 ? 'in_progress' : 'waiting',
        createdAt: roomData?.createdAt || Date.now(),
        updatedAt: Date.now()
      }, { merge: true })

      // Refresh the room data after joining
      const finalRoom = await getDoc(roomRef)
      const finalRoomData = finalRoom.data()
      const finalPlayerIds = Object.keys(finalRoomData?.players || {})
      
      console.log('🏁 Final room players:', finalPlayerIds)

      // If two players have joined, update game state
      if (finalPlayerIds.length === 2) {
        console.log('🎮 Starting game with two players')
        await updateDoc(roomRef, {
          status: 'in_progress',
          'gameState.currentTurn': finalPlayerIds[0], // First player starts
          'gameState.timestamp': Date.now()
        })
      }

      // Set up a more robust snapshot listener
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const roomData = doc.data() as GameRoom
          console.log('📡 Room snapshot update:', JSON.stringify(roomData))
          
          // Debug logging for formation
          try {
            const defaultFormation = getDefaultFormation()
            console.error('🏁 Default Formation in Snapshot:', defaultFormation)
          } catch (error) {
            console.error('❌ Error getting default formation:', error)
          }
          
          // Ensure all required fields are present
          const safeRoomData = {
            ...roomData,
            settings: roomData.settings || {
              mode: 'timed',
              duration: 300,
              goalTarget: 10
            },
            gameState: roomData.gameState || {
              board: createInitialGameBoard(getDefaultFormation()),
              currentTurn: null,
              lastMove: null,
              timestamp: Date.now(),
              formation: getDefaultFormation()  // Store formation name
            }
          }
          
          // Immediately set the current room
          currentRoom.value = { 
            id: doc.id, 
            ...safeRoomData 
          }
          
          // If room is in progress, navigate to game
          if (safeRoomData.status === 'in_progress') {
            console.log('🚀 Navigating to game')
            router.replace('/game')
          }
        } else {
          console.warn('❌ Room no longer exists')
          currentRoom.value = null
        }
      }, (error) => {
        console.error('🔥 Snapshot error:', error)
      })

      // Store unsubscribe function to clean up later if needed
      currentRoom.value = { 
        id: roomId, 
        unsubscribe,
        players: updatedPlayers,
        status: 'waiting',
        gameState: gameState,
        settings: settings
      } as GameRoom

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
    makeMove,
    leaveRoom
  }
})
