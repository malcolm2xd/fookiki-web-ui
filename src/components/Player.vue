<template>
  <div class="player" :style="{ top: playerPosition.y + 'px', left: playerPosition.x + 'px' }">
    {{ playerName }}
  </div>
</template>

<script>
export default {
  name: 'Player',
  props: {
    playerName: {
      type: String,
      required: true
    },
    playerPosition: {
      type: Object,
      required: true
    }
  },
  methods: {
    move(newPosition) {
      this.$emit('move', newPosition);
    }
  }
}
</script>

<style scoped>
.player {
  position: absolute;
  width: 50px;
  height: 50px;
  background-color: blue;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>