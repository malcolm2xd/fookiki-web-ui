<template>
  <div class="game-controls">
    <h3 class="controls-title">Game Controls</h3>
    
    <div class="control-group">
      <button 
        class="control-btn"
        @click="resetCurrentTurn"
        :disabled="!canResetTurn"
      >
        Reset Turn
      </button>
      
      <button 
        class="control-btn"
        @click="skipTurn"
        :disabled="!canSkipTurn"
      >
        End Turn
      </button>
    </div>
    
    <div class="control-group">
      <button 
        class="control-btn danger"
        @click="resetGame"
      >
        Reset Game
      </button>
    </div>
    
    <div class="settings-group">
      <div class="setting-toggle">
        <input 
          type="checkbox" 
          id="show-coordinates" 
          v-model="showCoordinates"
        >
        <label for="show-coordinates">Show Grid Coordinates</label>
      </div>
      
      <div class="setting-toggle">
        <input 
          type="checkbox" 
          id="show-valid-moves" 
          v-model="showValidMoves"
        >
        <label for="show-valid-moves">Show Valid Moves</label>
      </div>
    </div>
    
    <div class="game-info">
      <p>Turn: {{ currentTurn }}</p>
      <p>Game phase: {{ readableGamePhase }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'GameControls',
  emits: ['reset-game'],
  setup(props, { emit }) {
    const store = useStore();
    
    const gamePhase = computed(() => store.state.game.gamePhase);
    const currentTurn = computed(() => store.state.game.currentTurn);
    
    const showCoordinates = computed({
      get: () => store.state.game.showCoordinates,
      set: (value) => store.commit('game/setShowCoordinates', value)
    });
    
    const showValidMoves = computed({
      get: () => store.state.game.showValidMoves,
      set: (value) => store.commit('game/setShowValidMoves', value)
    });
    
    const canResetTurn = computed(() => {
      return (
        gamePhase.value !== 'GAME_OVER' && 
        gamePhase.value !== 'PLAYER_SELECTION' &&
        currentTurn.value > 1
      );
    });
    
    const canSkipTurn = computed(() => {
      return gamePhase.value !== 'GAME_OVER';
    });
    
    const readableGamePhase = computed(() => {
      switch (gamePhase.value) {
        case 'PLAYER_SELECTION':
          return 'Player Selection';
        case 'PLAYER_MOVEMENT':
          return 'Player Movement';
        case 'BALL_MOVEMENT':
          return 'Ball Movement';
        case 'GAME_OVER':
          return 'Game Over';
        default:
          return gamePhase.value;
      }
    });
    
    const resetCurrentTurn = () => {
      if (canResetTurn.value) {
        store.dispatch('game/resetTurn');
      }
    };
    
    const skipTurn = () => {
      if (canSkipTurn.value) {
        store.dispatch('game/endTurn');
      }
    };
    
    const resetGame = () => {
      emit('reset-game');
    };
    
    return {
      currentTurn,
      gamePhase,
      readableGamePhase,
      showCoordinates,
      showValidMoves,
      canResetTurn,
      canSkipTurn,
      
      resetCurrentTurn,
      skipTurn,
      resetGame
    };
  }
});
</script>

<style scoped>
.game-controls {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.controls-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #333;
}

.control-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  font-weight: bold;
  cursor: pointer;
  flex: 1;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background-color: #388E3C;
}

.control-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.control-btn.danger {
  background-color: #F44336;
}

.control-btn.danger:hover {
  background-color: #D32F2F;
}

.settings-group {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.setting-toggle label {
  font-size: 0.9rem;
  cursor: pointer;
}

.game-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
}

.game-info p {
  margin: 0.25rem 0;
}
</style>
