<template>
  <div v-if="show" class="celebration-modal">
    <div class="celebration-content">
      <div class="celebration-message">{{ message }}</div>
      <div v-if="team" class="celebration-team" :class="team">{{ team.toUpperCase() }}</div>
      <button @click="onClose" class="celebration-button">Continue</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';

const gameStore = useGameStore();
const { celebration } = storeToRefs(gameStore);

const show = computed(() => celebration.value.show);
const message = computed(() => celebration.value.message);
const team = computed(() => celebration.value.team);

const onClose = () => {
  gameStore.hideCelebration();
};
</script>

<style scoped>
.celebration-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.celebration-content {
  background-color: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  animation: popIn 0.5s ease-out;
}

.celebration-message {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #333;
}

.celebration-team {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
}

.celebration-team.blue {
  color: #0066cc;
}

.celebration-team.red {
  color: #cc0000;
}

.celebration-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1.2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.celebration-button:hover {
  background-color: #45a049;
}

@keyframes popIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 