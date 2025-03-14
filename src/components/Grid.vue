<template>
  <div class="grid">
    <div
      v-for="row in gridSize"
      :key="row"
      class="grid-row"
    >
      <div
        v-for="col in gridSize"
        :key="col"
        class="grid-cell"
        :class="{ 'cell-active': isCellActive(row, col) }"
        @click="handleCellClick(row, col)"
      >
        <Player v-if="isPlayerAt(row, col)" :position="{ row, col }" />
        <Ball v-if="isBallAt(row, col)" :position="{ row, col }" />
      </div>
    </div>
  </div>
</template>

<script>
import Player from './Player.vue';
import Ball from './Ball.vue';

export default {
  components: {
    Player,
    Ball,
  },
  props: {
    gridSize: {
      type: Number,
      required: true,
    },
    players: {
      type: Array,
      required: true,
    },
    ballPosition: {
      type: Object,
      required: true,
    },
  },
  methods: {
    isPlayerAt(row, col) {
      return this.players.some(player => player.position.row === row && player.position.col === col);
    },
    isBallAt(row, col) {
      return this.ballPosition.row === row && this.ballPosition.col === col;
    },
    handleCellClick(row, col) {
      // Logic to handle cell click for player movement or ball movement
    },
    isCellActive(row, col) {
      // Logic to determine if a cell is active for movement
      return false; // Placeholder
    },
  },
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 5px;
}
.grid-row {
  display: contents;
}
.grid-cell {
  width: 50px;
  height: 50px;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell-active {
  background-color: #e0e0e0;
}
</style>