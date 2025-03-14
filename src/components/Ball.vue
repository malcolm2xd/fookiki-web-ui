<template>
  <div class="ball" :style="{ top: ballPosition.y + 'px', left: ballPosition.x + 'px' }"></div>
</template>

<script>
export default {
  name: 'Ball',
  props: {
    initialPosition: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      ballPosition: this.initialPosition
    };
  },
  methods: {
    moveBall(newPosition) {
      this.ballPosition = newPosition;
    }
  }
};
</script>

<style scoped>
.ball {
  width: 20px;
  height: 20px;
  background-color: yellow;
  border-radius: 50%;
  position: absolute;
}
</style>