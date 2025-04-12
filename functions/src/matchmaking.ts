import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

interface MatchRequest {
  uid: string
  phoneNumber: string
  preferences: {
    mode: 'timed' | 'race'
    duration?: number
    goalTarget?: number
  }
  timestamp: number
  matched?: boolean
}

interface MatchedRequest {
  request: MatchRequest
  id: string
}

export const handleMatchmaking = functions.database.ref('/matchmaking/{requestId}')
  .onCreate(async (snapshot, context) => {
    const request = snapshot.val() as MatchRequest
    const { uid, phoneNumber, preferences } = request

    try {
      const db = admin.database()
      const matchmakingRef = db.ref('matchmaking')

      // Get all requests ordered by timestamp
      const snapshot = await matchmakingRef
        .orderByChild('timestamp')
        .endBefore(request.timestamp)
        .limitToLast(10)
        .once('value')

      let matchedRequest: MatchedRequest | undefined

      // Convert snapshot to array for easier processing
      const requests: Array<[string, MatchRequest]> = []
      snapshot.forEach((childSnapshot: admin.database.DataSnapshot) => {
        const otherRequest = childSnapshot.val() as MatchRequest
        const snapshotKey = childSnapshot.key
        if (snapshotKey && !otherRequest.matched) {
          requests.push([snapshotKey, otherRequest])
        }
        return false
      })

      // Sort by timestamp to get the most recent unmatched request
      requests.sort((a, b) => b[1].timestamp - a[1].timestamp)

      // Find the first matching request
      for (const [snapshotKey, otherRequest] of requests) {
        // Skip if it's the same user
        if (otherRequest.uid === uid) continue

        // Check if preferences match
        const prefsMatch = (
          otherRequest.preferences.mode === preferences.mode &&
          (!preferences.duration || otherRequest.preferences.duration === preferences.duration) &&
          (!preferences.goalTarget || otherRequest.preferences.goalTarget === preferences.goalTarget)
        )

        if (prefsMatch) {
          matchedRequest = {
            request: otherRequest,
            id: snapshotKey
          }
          break
        }
      }

      if (matchedRequest) {
        // Create a game room
        const gameRoomRef = admin.firestore().collection('gameRooms').doc()
        await gameRoomRef.set({
          id: gameRoomRef.id,
          status: 'waiting',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          settings: {
            mode: preferences.mode,
            duration: preferences.duration,
            goalTarget: preferences.goalTarget
          },
          players: {
            [uid]: {
              phoneNumber,
              ready: false,
              score: 0
            },
            [matchedRequest.request.uid]: {
              phoneNumber: matchedRequest.request.phoneNumber,
              ready: false,
              score: 0
            }
          },
          gameState: {
            currentTurn: uid,
            board: Array(8).fill(null).map(() => Array(8).fill(null)),
            lastMove: null,
            timestamp: Date.now()
          }
        })

        // Update both players' match status and clean up matchmaking entries
        const updates: { [key: string]: any } = {
          [`matches/${uid}`]: { roomId: gameRoomRef.id },
          [`matches/${matchedRequest.request.uid}`]: { roomId: gameRoomRef.id },
          [`matchmaking/${context.params.requestId}`]: null,
          [`matchmaking/${matchedRequest.id}`]: null
        }
        
        await db.ref().update(updates)
      }
    } catch (error) {
      console.error('Matchmaking error:', error)
    }
  })
