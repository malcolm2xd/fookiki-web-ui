<template>
  <div id="app">
    <GameView />
  </div>
</template>

<script>
import GameView from './views/GameView.vue';

export default {
  name: 'App',
  components: {
    GameView
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>