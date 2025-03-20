<template>
  <div class="app">
    <GameBoard />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import GameBoard from '@/components/GameBoard.vue'

export default defineComponent({
  name: 'App',
  components: {
    GameBoard
  },
  setup() {
    const store = useGameStore()
    
    onMounted(() => {
      store.initializeGame()
    })
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
