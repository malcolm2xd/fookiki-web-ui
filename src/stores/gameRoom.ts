import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, firestore, db } from '@/config/firebase'
import { ref as dbRef, push, onValue, update, serverTimestamp } from 'firebase/database'
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import type { GameRoom, MatchRequest } from '@/types/game'

export const useGameRoomStore = defineStore('gameRoom', () => {
  // State
  const currentRoom = ref<GameRoom | null>(null)
  const matchmakingStatus = ref<'idle' | 'searching' | 'joining'>('idle')
  const error = ref<string | null>(null)

  // Getters
  const isInRoom = computed(() => currentRoom.value !== null)
  const isMyTurn = computed(() => {
    if (!currentRoom.value || !auth.currentUser) return false
    return currentRoom.value.gameState.currentTurn === auth.currentUser.uid
  })
  const myScore = computed(() => {
    if (!currentRoom.value || !auth.currentUser) return 0
    return currentRoom.value.players[auth.currentUser.uid]?.score || 0
  })

  // Actions
  async function findMatch(preferences: { mode: 'timed' | 'race', duration?: number, goalTarget?: number }) {
    try {
      if (!auth.currentUser?.phoneNumber) throw new Error('User not authenticated')
      
      matchmakingStatus.value = 'searching'
      error.value = null

      // Add to matchmaking queue
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
      const unsubscribe = onValue(matchRef, async (snapshot) => {
        const match = snapshot.val()
        if (match?.roomId) {
          // Found a match, clean up
          unsubscribe()
          await update(matchRef, {})
          await update(newRequestRef, {})
          await joinRoom(match.roomId)
        }
      })

      // Clean up if component is unmounted
      window.addEventListener('beforeunload', async () => {
        unsubscribe()
        await update(newRequestRef, {})
        await update(matchRef, {})
      })
    } catch (e) {
      error.value = (e as Error).message
      matchmakingStatus.value = 'idle'
      throw e
    }
  }

  async function joinRoom(roomId: string) {
    try {
      if (!auth.currentUser?.phoneNumber) throw new Error('User not authenticated')
      
      matchmakingStatus.value = 'joining'
      error.value = null

      // Join the room in Firestore
      const roomRef = doc(firestore, 'gameRooms', roomId)
      await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}`]: {
          phoneNumber: auth.currentUser.phoneNumber,
          ready: false,
          score: 0
        },
        updatedAt: Date.now()
      })

      // Subscribe to room updates
      onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          currentRoom.value = { id: doc.id, ...doc.data() } as GameRoom
        } else {
          currentRoom.value = null
        }
      })

      matchmakingStatus.value = 'idle'
    } catch (e) {
      error.value = (e as Error).message
      matchmakingStatus.value = 'idle'
      throw e
    }
  }

  async function setReady(ready: boolean) {
    try {
      if (!currentRoom.value || !auth.currentUser) return
      
      const roomRef = doc(firestore, 'gameRooms', currentRoom.value.id)
      await updateDoc(roomRef, {
        [`players.${auth.currentUser.uid}.ready`]: ready,
        updatedAt: Date.now()
      })
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }

  async function makeMove(from: [number, number], to: [number, number]) {
    try {
      if (!currentRoom.value || !auth.currentUser || !isMyTurn.value) return
      
      const roomRef = doc(firestore, 'gameRooms', currentRoom.value.id)
      await updateDoc(roomRef, {
        'gameState.board': currentRoom.value.gameState.board, // Updated board state
        'gameState.currentTurn': getNextTurnPlayer(),
        'gameState.lastMove': { from, to },
        'gameState.timestamp': Date.now(),
        updatedAt: Date.now()
      })
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
    
    // Actions
    findMatch,
    joinRoom,
    setReady,
    makeMove,
    leaveRoom
  }
})
