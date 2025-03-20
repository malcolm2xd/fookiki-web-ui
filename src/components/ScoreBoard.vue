<template>
  <div class="score-board">
    <div class="teams">
      <div class="team team-blue">
        <div class="team-name">Blue Team</div>
        <div class="team-score">{{ blueScore }}</div>
      </div>
      
      <div class="vs">VS</div>
      
      <div class="team team-red">
        <div class="team-name">Red Team</div>
        <div class="team-score">{{ redScore }}</div>
      </div>
    </div>
    
    <div class="game-stats">
      <div class="stat">
        <div class="stat-label">Possession</div>
        <div class="stat-bar">
          <div 
            class="stat-value blue" 
            :style="{ width: `${bluePossession}%` }"
          ></div>
          <div 
            class="stat-value red" 
            :style="{ width: `${redPossession}%` }"
          ></div>
        </div>
        <div class="stat-numbers">
          <span>{{ bluePossession }}%</span>
          <span>{{ redPossession }}%</span>
        </div>
      </div>
      
      <div class="stat">
        <div class="stat-label">Moves</div>
        <div class="stat-numbers stacked">
          <div>Blue: {{ blueMoves }}</div>
          <div>Red: {{ redMoves }}</div>
        </div>
      </div>
      
      <div class="stat">
        <div class="stat-label">Ball Passes</div>
        <div class="stat-numbers stacked">
          <div>Blue: {{ bluePasses }}</div>
          <div>Red: {{ redPasses }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'ScoreBoard',
  setup() {
    const store = useStore();
    
    const blueScore = computed(() => store.state.game.score.blue);
    const redScore = computed(() => store.state.game.score.red);
    
    const blueMoves = computed(() => store.state.game.stats.moves.blue);
    const redMoves = computed(() => store.state.game.stats.moves.red);
    
    const bluePasses = computed(() => store.state.game.stats.passes.blue);
    const redPasses = computed(() => store.state.game.stats.passes.red);
    
    const totalMoves = computed(() => blueMoves.value + redMoves.value);
    
    const bluePossession = computed(() => {
      if (totalMoves.value === 0) return 50;
      return Math.round((blueMoves.value / totalMoves.value) * 100);
    });
    
    const redPossession = computed(() => {
      if (totalMoves.value === 0) return 50;
      return Math.round((redMoves.value / totalMoves.value) * 100);
    });
    
    return {
      blueScore,
      redScore,
      blueMoves,
      redMoves,
      bluePasses,
      redPasses,
      bluePossession,
      redPossession
    };
  }
});
</script>

<style scoped>
.score-board {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
}

.team-name {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.team-score {
  font-size: 2rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: white;
}

.team-blue .team-score {
  background-color: #1976D2;
}

.team-red .team-score {
  background-color: #D32F2F;
}

.vs {
  font-size: 1.2rem;
  font-weight: bold;
  color: #666;
}

.game-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #333;
}

.stat-bar {
  height: 10px;
  background-color: #eee;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
}

.stat-value {
  height: 100%;
  transition: width 0.5s ease;
}

.stat-value.blue {
  background-color: #1976D2;
}

.stat-value.red {
  background-color: #D32F2F;
}

.stat-numbers {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
}

.stat-numbers.stacked {
  flex-direction: column;
  gap: 0.25rem;
}
</style>
