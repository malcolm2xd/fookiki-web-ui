<template>
  <div class="app">
    <GameConfig v-if="!gameStarted" />
    <GameBoard v-else />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import GameBoard from '@/components/GameBoard.vue'
import GameConfig from '@/components/GameConfig.vue'

export default defineComponent({
  name: 'App',
  components: {
    GameBoard,
    GameConfig
  },
  setup() {
    const store = useGameStore()
    const gameStarted = ref(false)

    // Watch for game initialization
    store.$subscribe((_, state) => {
      if (state.players.length > 0) {
        gameStarted.value = true
      }
    })

    return {
      gameStarted
    }
  }
})
</script>

<style>
.app {
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}
</style>
