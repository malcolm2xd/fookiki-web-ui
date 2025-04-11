<template>
  <div class="app">
    <div v-if="authStore.loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
    <router-view v-else></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default defineComponent({
  name: 'App',

  setup() {
    const authStore = useAuthStore()

    return {
      authStore
    }
  }
})
</script>

<style>
.app {
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f5f5;
  color: rgb(53, 56, 85);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #333;
  border-top: 5px solid #1976D2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
