<template>
  <div class="ball">
    <svg class="ball-circle" viewBox="0 0 100 100">
      <!-- White background circle -->
      <circle cx="50" cy="50" r="48" fill="white" stroke="black" stroke-width="2"/>
      
      <!-- Black pentagon in the middle -->
      <path d="M50 25 L70 40 L65 65 L35 65 L30 40 Z" fill="black"/>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Position } from '@/types/player'

export default defineComponent({
  name: 'Ball',
  props: {
    position: {
      type: Object as PropType<Position>,
      required: true
    }
  }
})
</script>

<style scoped>
.ball {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.ball-circle {
  width: 70%;
  height: 70%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ball.is-moving {
  animation: spin 0.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .ball {
    width: 25px;
    height: 25px;
  }
}
</style>
