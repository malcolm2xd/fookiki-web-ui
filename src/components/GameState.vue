<template>
  <div class="game-state">
    <div class="scoreboard" :style="timerStyle">
      <div class="team-score">
        <div class="team-name blue">Blue Team</div>
        <div class="score">{{ blueScore }}</div>
      </div>
      <div class="game-timer">
        {{ gameTimeDisplay }}
        <div v-if="store.gameTimerState.isExtraTime" class="extra-time">Extra Time</div>
      </div>
      <div class="team-score">
        <div class="team-name red">Red Team</div>
        <div class="score">{{ redScore }}</div>
      </div>
    </div>
    <button class="timer-toggle" @click="store.toggleTimer()">
      {{ store.timerConfig.enabled ? 'Disable Timer' : 'Enable Timer' }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useGameStore } from '@/stores/game'

export default defineComponent({
  name: 'GameState',
  setup() {
    const store = useGameStore()
    
    const blueScore = computed(() => store.blueScore)
    const redScore = computed(() => store.redScore)
    const currentTeam = computed(() => store.currentTeam)
    
    const gameTimeDisplay = computed(() => {
      const minutes = Math.floor(store.gameTimerState.timeLeft / 60)
      const seconds = store.gameTimerState.timeLeft % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    })
    
    const timerStyle = computed(() => {
      const currentTeamColor = currentTeam.value === 'blue' ? '#1976D2' : '#D32F2F'
      const progress = store.timerState.timeLeft / store.timerConfig.duration

      if (!store.timerConfig.enabled) {
        return {
          background: currentTeamColor,
          transition: 'none'
        }
      }

      if (currentTeam.value === 'blue') {
        return {
          background: `linear-gradient(to left, ${currentTeamColor} ${progress * 100}%, transparent ${progress * 100}%)`,
          transition: 'background 1s linear'
        }
      } else {
        return {
          background: `linear-gradient(to right, ${currentTeamColor} ${progress * 100}%, transparent ${progress * 100}%)`,
          transition: 'background 1s linear'
        }
      }
    })

    return {
      store,
      blueScore,
      redScore,
      currentTeam,
      timerStyle,
      gameTimeDisplay
    }
  }
})
</script>

<style scoped>
.game-state {
  margin-top: 1rem;
}

.scoreboard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  position: relative;
  border: 2px solid #e0e0e0;
}

.team-score {
  text-align: center;
  flex: 1;
}

.team-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.score {
  font-size: 1.2rem;
  font-weight: bold;
}

.state-box {
  border-radius: 8px;
  padding: 1rem;
  color: white;
  transition: background-color 0.3s ease;
}

.state-box.blue {
  background-color: #1976D2;
}

.state-box.red {
  background-color: #D32F2F;
}

.timer-toggle {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.timer-toggle:hover {
  background-color: #45a049;
}

.game-timer {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-shadow: 0 0 2px white;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  min-width: 80px;
  text-align: center;
}

.extra-time {
  font-size: 0.8rem;
  color: #FFA000;
  font-weight: bold;
  margin-top: 0.25rem;
}
</style> 