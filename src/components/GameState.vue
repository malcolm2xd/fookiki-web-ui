<template>
  <div class="game-state">
    <div class="scoreboard" :style="timerStyle">
      <div class="team-score">
        <div class="team-name blue">Blue Team</div>
        <div class="score">{{ blueScore }}</div>
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
    
    const timerStyle = computed(() => {
      const teamColor = currentTeam.value === 'blue' ? '#1976D2' : '#D32F2F'
      
      if (!store.timerConfig.enabled) {
        return {
          background: teamColor,
          transition: 'none'
        }
      }
      
      const progress = (store.timerState.timeLeft / store.timerConfig.duration) * 100
      
      return {
        background: `linear-gradient(to right, ${teamColor} ${progress}%, transparent ${progress}%)`,
        transition: store.timerState.isRunning ? 'background 1s linear' : 'none'
      }
    })

    return {
      store,
      blueScore,
      redScore,
      currentTeam,
      timerStyle
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
</style> 