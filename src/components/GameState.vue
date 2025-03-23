<template>
  <div class="game-state">
    <div class="state-box" :class="currentTeam">
      <div class="score">
        Blue {{ score.blue }} - {{ score.red }} Red
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useGameStore } from '@/stores/game'

export default defineComponent({
  name: 'GameState',
  setup() {
    const store = useGameStore()
    
    const currentTeam = computed(() => store.currentTeam)
    const score = computed(() => store.score)
    
    return {
      currentTeam,
      score
    }
  }
})
</script>

<style scoped>
.game-state {
  margin-top: 1rem;
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

.score {
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
}
</style> 