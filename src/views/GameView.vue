<template>
  <div class="game-view">
    <Grid :gridSize="gridSize" :players="players" :ball="ball" @movePlayer="movePlayer" @moveBall="moveBall" />
  </div>
</template>

<script>
import Grid from '@/components/Grid.vue';

export default {
  components: {
    Grid,
  },
  data() {
    return {
      gridSize: 5, // Example size, can be adjusted
      players: [
        { id: 1, position: { x: 0, y: 0 } },
        { id: 2, position: { x: 0, y: 1 } },
      ],
      ball: { position: { x: 2, y: 2 } },
    };
  },
  methods: {
    movePlayer(playerId, newPosition) {
      const player = this.players.find(p => p.id === playerId);
      if (player) {
        player.position = newPosition;
      }
    },
    moveBall(newPosition) {
      this.ball.position = newPosition;
    },
  },
};
</script>

<style scoped>
.game-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>