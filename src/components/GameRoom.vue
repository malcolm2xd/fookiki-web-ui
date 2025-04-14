<template>
  <div class="game-room">
    <div v-if="gameRoomStore.matchmakingStatus === 'searching'" class="finding-match">
      <div class="loading-spinner"></div>
      <h2>Finding a match...</h2>
      <button @click="cancelMatchmaking" class="cancel-button">Cancel</button>
    </div>

    <div v-else-if="gameRoomStore.currentRoom" class="game-room-content">
      <div class="room-details">
        <h2>Game Room</h2>
        <div class="game-settings">
          <p>Mode: {{ formatGameMode(gameRoomStore.currentRoom.settings.mode) }}</p>
          <p v-if="gameRoomStore.currentRoom.settings.mode === 'timed'">
            Duration: {{ formatDuration(gameRoomStore.currentRoom.settings.duration) }}
          </p>
        </div>
      </div>

      <div class="players-list">
        <div 
          v-for="(player, uid) in gameRoomStore.currentRoom?.players" 
          :key="uid"
          class="player-item"
          :class="{ 
            'blue-player': player.color === 'blue',
            'red-player': player.color === 'red'
          }"
        >
          <div class="player-details">
            <span class="player-name">
              {{ player.displayName }}
            </span>
            <span class="player-score">Score: {{ player.score }}</span>
          </div>
        </div>
      </div>

      <div class="room-actions">
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
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameRoomStore } from '@/stores/gameRoom'
import { auth } from '@/config/firebase'

const router = useRouter()
const gameRoomStore = useGameRoomStore()

function formatDuration(duration: number): string {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatGameMode(mode: string): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

function goBack() {
  router.push('/lobby')
}

async function leaveRoom() {
  try {
    await gameRoomStore.leaveRoom()
    router.push('/lobby')
  } catch (error) {
    console.error('Error leaving room:', error)
  }
}

onMounted(() => {
  const roomId = router.currentRoute.value.params.id as string
  if (roomId) {
    gameRoomStore.joinRoom(roomId)
  }
})
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

.game-room-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.room-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.game-settings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.player-item.blue-player {
  background-color: rgba(0, 0, 255, 0.1);
  border-left: 4px solid blue;
}

.player-item.red-player {
  background-color: rgba(255, 0, 0, 0.1);
  border-left: 4px solid red;
}

.player-details {
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

.room-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

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

.leave-button,
.cancel-button,
.back-button {
  background: #6c757d;
  color: white;
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
