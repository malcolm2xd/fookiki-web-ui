<template>
  <div class="game-room">
    <div v-if="gameRoomStore.matchmakingStatus === 'searching'" class="finding-match">
      <div class="loading-spinner"></div>
      <h2>Finding a match...</h2>
      <button @click="cancelMatchmaking" class="cancel-button">Cancel</button>
    </div>

    <div v-else-if="gameRoomStore.currentRoom" class="room-content">
      <div class="room-header">
        <h2>Game Room</h2>
        <div class="game-info">
          <span>Mode: {{ gameRoomStore.currentRoom.settings.mode }}</span>
          <span v-if="gameRoomStore.currentRoom.settings.duration">
            Duration: {{ formatDuration(gameRoomStore.currentRoom.settings.duration) }}
          </span>
          <span v-if="gameRoomStore.currentRoom.settings.goalTarget">
            Goals to win: {{ gameRoomStore.currentRoom.settings.goalTarget }}
          </span>
        </div>
      </div>

      <div class="players-list">
        <div 
          v-for="(player, uid) in gameRoomStore.currentRoom.players" 
          :key="uid"
          class="player-item"
          :class="{ 'current-turn': gameRoomStore.currentRoom.gameState.currentTurn === uid }"
        >
          <div class="player-info">
            <span class="player-name">{{ player.phoneNumber }}</span>
            <span class="player-score">Score: {{ player.score }}</span>
          </div>
          <div class="player-status">
            <span v-if="player.ready" class="ready">Ready</span>
            <span v-else class="not-ready">Not Ready</span>
          </div>
        </div>
      </div>

      <div class="room-actions">
        <button 
          v-if="!isReady"
          @click="setReady(true)" 
          class="ready-button"
        >
          Ready
        </button>
        <button 
          v-else
          @click="setReady(false)" 
          class="not-ready-button"
        >
          Not Ready
        </button>
        <button @click="leaveRoom" class="leave-button">Leave Room</button>
      </div>
    </div>

    <div v-else class="error-state">
      <h2>Room not found</h2>
      <button @click="goBack" class="back-button">Back to Game Setup</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameRoomStore } from '@/stores/gameRoom'
import { auth } from '@/config/firebase'

const router = useRouter()
const gameRoomStore = useGameRoomStore()

const isReady = computed(() => {
  if (!gameRoomStore.currentRoom || !auth.currentUser) return false
  return gameRoomStore.currentRoom.players[auth.currentUser.uid]?.ready || false
})

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes} minutes`
}

async function setReady(ready: boolean) {
  try {
    await gameRoomStore.setReady(ready)
  } catch (error) {
    console.error('Failed to set ready status:', error)
  }
}

async function leaveRoom() {
  try {
    await gameRoomStore.leaveRoom()
    router.push('/lobby')
  } catch (error) {
    console.error('Failed to leave room:', error)
  }
}

function goBack() {
  router.push('/lobby')
}

function cancelMatchmaking() {
  // TODO: Implement cancel matchmaking
  router.push('/lobby')
}
</script>

<style scoped>
.game-room {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.finding-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.room-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.game-info {
  display: flex;
  gap: 1rem;
  color: #666;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
}

.player-item.current-turn {
  border-color: #4CAF50;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-name {
  font-weight: bold;
}

.player-score {
  color: #666;
}

.player-status .ready {
  color: #4CAF50;
}

.player-status .not-ready {
  color: #dc3545;
}

.room-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.ready-button,
.not-ready-button,
.leave-button,
.cancel-button,
.back-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ready-button {
  background: #4CAF50;
  color: white;
}

.not-ready-button {
  background: #dc3545;
  color: white;
}

.leave-button,
.cancel-button,
.back-button {
  background: #6c757d;
  color: white;
}

.ready-button:hover {
  background: #45a049;
}

.not-ready-button:hover {
  background: #c82333;
}

.leave-button:hover,
.cancel-button:hover,
.back-button:hover {
  background: #5a6268;
}

.error-state {
  text-align: center;
  color: #dc3545;
}
</style>
