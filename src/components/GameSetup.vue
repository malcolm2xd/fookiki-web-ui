<template>
  <div class="game-setup">
    <h2 class="setup-title">Welcome to Fookiki!</h2>
    <p class="setup-description">
      A chess-inspired football strategy game with grid-based movement and turn-based gameplay.
    </p>
    
    <div class="setup-form">
      <div class="setup-section">
        <h3>Game Settings</h3>
        
        <div class="form-group">
          <label for="grid-size">Grid Size ({{ gridSize }}x{{ gridSize }})</label>
          <input 
            type="range" 
            id="grid-size" 
            v-model.number="gridSize" 
            min="5" 
            max="15" 
            step="2"
          >
          <div class="range-values">
            <span>5x5</span>
            <span>15x15</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="players-per-team">Players per Team ({{ playersPerTeam }})</label>
          <input 
            type="range" 
            id="players-per-team" 
            v-model.number="playersPerTeam" 
            :min="2" 
            :max="maxPlayers" 
            step="1"
          >
          <div class="range-values">
            <span>2</span>
            <span>{{ maxPlayers }}</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="winning-score">Winning Score ({{ winningScore }} goals)</label>
          <input 
            type="range" 
            id="winning-score" 
            v-model.number="winningScore" 
            min="1" 
            max="10" 
            step="1"
          >
          <div class="range-values">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </div>
      
      <div class="setup-section">
        <h3>Game Mode</h3>
        
        <div class="form-group">
          <div class="game-mode-options">
            <div 
              class="game-mode-option" 
              :class="{ active: gameMode === 'local' }"
              @click="gameMode = 'local'"
            >
              <div class="mode-icon">👥</div>
              <div class="mode-title">2 Players (Local)</div>
              <div class="mode-description">Play against a friend on the same device</div>
            </div>
            
            <div 
              class="game-mode-option" 
              :class="{ active: gameMode === 'ai' }"
              @click="gameMode = 'ai'"
            >
              <div class="mode-icon">🤖</div>
              <div class="mode-title">vs Computer</div>
              <div class="mode-description">Play against the AI</div>
            </div>
            
            <div 
              class="game-mode-option disabled" 
              title="Coming soon!"
            >
              <div class="mode-icon">🌐</div>
              <div class="mode-title">Online (Coming Soon)</div>
              <div class="mode-description">Play against others online</div>
            </div>
          </div>
        </div>
        
        <div class="form-group" v-if="gameMode === 'ai'">
          <label for="ai-difficulty">AI Difficulty</label>
          <select id="ai-difficulty" v-model="aiDifficulty">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="setup-actions">
      <button class="start-game-btn" @click="startGame">Start Game</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'GameSetup',
  emits: ['start-game'],
  setup(props, { emit }) {
    const store = useStore();
    
    const gridSize = ref(9);
    const playersPerTeam = ref(5);
    const winningScore = ref(3);
    const gameMode = ref('local');
    const aiDifficulty = ref('medium');
    
    const maxPlayers = computed(() => {
      return Math.floor(gridSize.value / 2) + 1;
    });
    
    // Ensure players per team is valid when grid size changes
    const validatePlayersPerTeam = () => {
      if (playersPerTeam.value > maxPlayers.value) {
        playersPerTeam.value = maxPlayers.value;
      }
    };
    
    const startGame = () => {
      validatePlayersPerTeam();
      
      store.dispatch('game/setupGame', {
        gridSize: gridSize.value,
        playersPerTeam: playersPerTeam.value,
        winningScore: winningScore.value,
        gameMode: gameMode.value,
        aiDifficulty: aiDifficulty.value,
      });
      
      emit('start-game');
    };
    
    return {
      gridSize,
      playersPerTeam,
      winningScore,
      gameMode,
      aiDifficulty,
      maxPlayers,
      startGame
    };
  }
});
</script>

<style scoped>
.game-setup {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.setup-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
}

.setup-description {
  text-align: center;
  margin-bottom: 2rem;
  color: #666;
}

.setup-form {
  display: grid;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .setup-form {
    grid-template-columns: 1fr 1fr;
  }
}

.setup-section h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #555;
}

input[type="range"] {
  width: 100%;
  margin-bottom: 0.5rem;
}

select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 1rem;
}

.range-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #777;
}

.game-mode-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-mode-option {
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.game-mode-option:hover:not(.disabled) {
  border-color: #4CAF50;
  transform: translateY(-2px);
}

.game-mode-option.active {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.05);
}

.game-mode-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.mode-title {
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.mode-description {
  font-size: 0.9rem;
  color: #777;
}

.setup-actions {
  display: flex;
  justify-content: center;
}

.start-game-btn {
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.start-game-btn:hover {
  background-color: #388E3C;
}
</style>
