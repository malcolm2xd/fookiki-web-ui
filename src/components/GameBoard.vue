<template>
  <div class="game-container">
    <div class="game-controls">
      <FormationSelector class="formation-selector" />
      <GameState class="game-state" />
      <button class="help-button" @click="showHelp = true">
        <span class="help-icon">?</span>
        Help
      </button>
    </div>
    <GameHelp :is-visible="showHelp" @close="showHelp = false" />
    <CelebrationModal />
    <div class="game-board-wrapper">
      <div class="game-board">
        <div class="playing-field">
          <!-- Row 1: Column Labels (A-J) -->
          <div v-for="col in totalDimensions.totalCols" :key="`col-${col}`" class="board-cell column-label">
            {{ col === 1 || col === totalDimensions.totalCols ? '' : String.fromCharCode(64 + col - 1) }}
          </div>

          <!-- Row 3: Top Goal -->
          <div v-for="col in totalDimensions.totalCols" :key="`goal-top-${col}`">
            <div 
              v-if="col >= 5 && col <= 8" 
              class="goal-cell goal-cell-blue"
              :class="{ 
                'valid-move': isValidMove(-1, col - 2),
                'clickable': isValidMove(-1, col - 2)
              }"
              @click="handleCellClick(-1, col - 2)"
            >
              <div v-if="isBallAtPosition(-1, col - 2)" class="ball">⚽</div>
      </div>
    </div>
    
          <!-- Playing Field Rows -->
          <template v-for="row in gridConfig.playingField.rows" :key="`row-${row}`">
            <!-- First column: Row numbers -->
            <div class="board-cell row-label">{{ row }}</div>

            <!-- Playing field cells -->
            <div 
              v-for="col in gridConfig.playingField.cols" 
              :key="`cell-${row}-${col}`"
              class="board-cell"
              :class="{
                'field-border-left': col === 1,
                'field-border-right': col === gridConfig.playingField.cols,
                'field-border-top': row === 1,
                'field-border-bottom': row === gridConfig.playingField.rows,
                'center-line': row === Math.floor(gridConfig.playingField.rows / 2),
                'penalty-border-left': col === 3 && ((row <= 4) || (row >= gridConfig.playingField.rows - 3)),
                'penalty-border-right': col === 8 && ((row <= 4) || (row >= gridConfig.playingField.rows - 3)),
                'penalty-border-top': row === 1 && col >= 3 && col <= 8,
                'penalty-border-bottom': (row === 4 && col >= 3 && col <= 8) ||
                                       (row === gridConfig.playingField.rows - 4 && col >= 3 && col <= 8),
                'field-corner-tl': col === 1 && row === 1,
                'field-corner-tr': col === gridConfig.playingField.cols && row === 1,
                'field-corner-bl': col === 1 && row === gridConfig.playingField.rows,
                'field-corner-br': col === gridConfig.playingField.cols && row === gridConfig.playingField.rows,
                'valid-move': isValidMove(row - 1, col - 1),
                'clickable': isValidMove(row - 1, col - 1) || getPlayerAtPosition(row - 1, col - 1)
              }"
              @click="handleCellClick(row - 1, col - 1)"
            >
              <!-- Player -->
              <div 
                v-if="getPlayerAtPosition(row - 1, col - 1)"
                class="player"
                :class="{
                  'player-blue': getPlayerAtPosition(row - 1, col - 1)?.team === 'blue',
                  'player-red': getPlayerAtPosition(row - 1, col - 1)?.team === 'red',
                  'player-selected': getPlayerAtPosition(row - 1, col - 1)?.id === selectedPlayerId,
                  'player-current-team': getPlayerAtPosition(row - 1, col - 1)?.team === currentTeam
                }"
              >
                <span class="player-role">{{ getPlayerAtPosition(row - 1, col - 1)?.role }}</span>
                <span v-if="getPlayerAtPosition(row - 1, col - 1)?.isCaptain" class="captain-star">★</span>
      </div>
      
              <!-- Ball -->
              <div 
                v-if="isBallAtPosition(row - 1, col - 1)"
                class="ball"
                :class="{ 'selected': isBallSelected }"
                @click="handleBallClick"
              >⚽</div>
            </div>
            <!-- Empty last column -->
            <div />
          </template>

          <!-- Bottom Goal -->
          <div v-for="col in totalDimensions.totalCols" :key="`goal-bottom-${col}`">
            <div 
              v-if="col >= 5 && col <= 8" 
              class="goal-cell goal-cell-red"
              :class="{ 
                'valid-move': isValidMove(16, col - 2),
                'clickable': isValidMove(16, col - 2)
              }"
              @click="handleCellClick(16, col - 2)"
            >
              <div v-if="isBallAtPosition(16, col - 2)" class="ball">⚽</div>
            </div>
          </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Position } from '@/types/player'
import FormationSelector from './FormationSelector.vue'
import GameState from './GameState.vue'
import GameHelp from './GameHelp.vue'
import CelebrationModal from './CelebrationModal.vue'

export default defineComponent({
  name: 'GameBoard',
  components: {
    FormationSelector,
    GameState,
    GameHelp,
    CelebrationModal
  },
  setup() {
    const store = useGameStore()
    const showHelp = ref(false)
    
    const gridConfig = computed(() => store.gridConfig)
    const totalDimensions = computed(() => store.totalDimensions)
    const players = computed(() => store.allPlayers)
    const selectedPlayerId = computed(() => store.selectedPlayerId)
    const validMoves = computed(() => store.validMoves)
    const ballPosition = computed(() => store.ballPosition)
    const currentTeam = computed(() => store.currentTeam)
    const isBallSelected = computed(() => store.isBallSelected)

    const getPlayerAtPosition = (row: number, col: number) => {
      return players.value.find(p => p.position.row === row && p.position.col === col)
    }

    const isBallAtPosition = (row: number, col: number) => {
      return ballPosition.value.row === row && ballPosition.value.col === col
    }

    const isValidMove = (row: number, col: number) => {
      return validMoves.value.some(move => move.row === row && move.col === col)
    }

    const handleBallClick = () => {
      store.selectBall()
    }

    const handleCellClick = (row: number, col: number) => {
      const player = getPlayerAtPosition(row, col)
      
      // If clicking on a non-move area, unselect
      if (!isValidMove(row, col) && !player && !isBallAtPosition(row, col)) {
        store.selectCell({ row, col })
        return
      }
      
      // Only allow selecting players from the current team
      if (player && player.team !== currentTeam.value) {
        store.selectCell({ row, col })
        return
      }
      
      // If clicking on a player from the current team, select it
      if (player && player.team === currentTeam.value) {
        store.selectCell({ row, col })
        return
      }
      
      // For ball movement
      store.selectCell({ row, col })
    }
    
    return {
      gridConfig,
      totalDimensions,
      selectedPlayerId,
      currentTeam,
      getPlayerAtPosition,
      isBallAtPosition,
      isValidMove,
      handleCellClick,
      handleBallClick,
      isBallSelected,
      showHelp
    }
  }
})
</script>

<style scoped>
.game-container {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  padding: 1rem;
}

.game-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 250px;
}

.game-board-wrapper {
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
}

.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: transparent;  /* Changed back to transparent */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  width: min(100%, calc(90vh * 0.58)); /* 11:19 ratio */
  height: calc(width * 1.727); /* 19:11 ratio */
  margin: 0 auto;
  --total-rows: v-bind(totalDimensions.totalRows);
  --total-cols: v-bind(totalDimensions.totalCols);
}

/* Main playing field container */
.playing-field {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: repeat(var(--total-rows), 1fr);
  grid-template-columns: repeat(var(--total-cols), 1fr);
}

.board-row {
  display: contents;
}

.board-cell {
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Play area cells (rows 4-19, columns 2-11) */
.board-cell:not(.column-label):not(.row-label):not([key^="empty-top-"]):not([key^="goal-top-"]):not([key^="goal-bottom-"]):not(:last-child) {
  background-color: #4CAF50;
}

/* Remove background from first column (row numbers) and last column */
.board-cell:first-child,
.board-cell:last-child,
[key^="goal-top-"],
[key^="goal-bottom-"] {
  background-color: transparent !important;
  border-color: transparent;
}

.board-cell:hover {
  background-color: rgba(255, 255, 255, 0.1);  /* Reverted to original hover color */
}

/* Center line */
.board-row:nth-child(8) .board-cell {
  border-bottom: 4px solid rgba(255, 255, 255, 0.8);
}

/* Penalty areas */
/* Top penalty area */
.board-row:nth-child(n+1):nth-child(-n+4) .board-cell:nth-child(n+3):nth-child(-n+8) {
  background-color: rgba(255, 255, 255, 0.1);
}
.board-row:nth-child(n+1):nth-child(-n+4) .board-cell:nth-child(n+3):nth-child(-n+8):hover {
  background-color: rgba(255, 255, 255, 0.2);
}
/* Remove border-top only from first row cells (adjacent to blue goal) */
.board-row:nth-child(1) .board-cell:nth-child(n+3):nth-child(-n+8) {
  border-top: none;
}
/* Top penalty area border */
.board-row:nth-child(4) .board-cell:nth-child(n+3):nth-child(-n+8) {  /* Bottom border */
  border-bottom: 4px solid rgba(255, 255, 255, 0.8);
}
.board-row:nth-child(n+1):nth-child(-n+4) .board-cell:nth-child(n+3):nth-child(-n+8) {  /* Left border */
  border-left: 4px solid rgba(255, 255, 255, 0.8);
}
.board-row:nth-child(n+1):nth-child(-n+4) .board-cell:nth-child(n+3):nth-child(-n+8) {  /* Right border */
  border-right: 4px solid rgba(255, 255, 255, 0.8);
}

/* Bottom penalty area */
.board-row:nth-child(n+13):nth-child(-n+16) .board-cell:nth-child(n+3):nth-child(-n+8) {
  background-color: rgba(255, 255, 255, 0.1);
}
.board-row:nth-child(n+13):nth-child(-n+16) .board-cell:nth-child(n+3):nth-child(-n+8):hover {
  background-color: rgba(255, 255, 255, 0.2);
}
/* Remove border-bottom only from last row cells (adjacent to red goal) */
.board-row:nth-child(16) .board-cell:nth-child(n+3):nth-child(-n+8) {
  border-bottom: none;
}
/* Bottom penalty area border */
.board-row:nth-child(13) .board-cell:nth-child(n+3):nth-child(-n+8) {  /* Top border */
  border-top: 4px solid rgba(255, 255, 255, 0.8);
}
.board-row:nth-child(n+13):nth-child(-n+16) .board-cell:nth-child(n+3):nth-child(-n+8) {  /* Left border */
  border-left: 4px solid rgba(255, 255, 255, 0.8);
}
.board-row:nth-child(n+13):nth-child(-n+16) .board-cell:nth-child(n+3):nth-child(-n+8) {  /* Right border */
  border-right: 4px solid rgba(255, 255, 255, 0.8);
}

/* Goals */
.goal {
  position: absolute;
  left: 30%;
  width: 40%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  height: calc(100% / 16);
}

.goal-top {
  top: 0;
  transform: translateY(-100%);
}

.goal-bottom {
  bottom: 0;
  transform: translateY(100%);
}

.goal-cell {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
}

.goal-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  background-size: 6px 6px;
}

.goal-cell-blue {
  background-color: #1976D2;
}

.goal-cell-red {
  background-color: #D32F2F;
}

/* Make net pattern slightly darker for visibility */
.goal-cell-blue::before {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
}

.goal-cell-red::before {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
}

/* Playing field borders */
.board-cell.field-border-left {
  border-left: 4px solid #2E7D32;
}

.board-cell.field-border-right {
  border-right: 4px solid #2E7D32;
}

.board-cell.field-border-top {
  border-top: 4px solid #2E7D32;
}

.board-cell.field-border-bottom {
  border-bottom: 4px solid #2E7D32;
}

/* Center line */
.board-cell.center-line {
  border-bottom: 4px solid #2E7D32;
}

/* Penalty areas */
.board-cell.penalty-area {
  background-color: rgba(255, 255, 255, 0.1);
}

.board-cell.penalty-border-left {
  border-left: 4px solid #2E7D32;
}

.board-cell.penalty-border-right {
  border-right: 4px solid #2E7D32;
}

.board-cell.penalty-border-top {
  border-top: 4px solid #2E7D32;
}

.board-cell.penalty-border-bottom {
  border-bottom: 4px solid #2E7D32;
}

/* Field corners */
.board-cell.field-corner-tl {
  border-top-left-radius: 5px;
}

.board-cell.field-corner-tr {
  border-top-right-radius: 5px;
}

.board-cell.field-corner-bl {
  border-bottom-left-radius: 5px;
}

.board-cell.field-corner-br {
  border-bottom-right-radius: 5px;
}

/* Labels */
.column-label,
.row-label {
  background-color: transparent !important;
  border-color: transparent;
  color: #000;
  font-weight: bold;
  font-size: 0.8rem;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

.player {
  width: 70%;
  height: 70%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #1976D2;
  color: white;
  transition: opacity 0.3s ease;
}

.player[class*="player-red"] {
  background-color: #D32F2F;
}

.player[class*="player-current-team"] {
  opacity: 1;
  cursor: pointer;
}

.player[class*="player-current-team"]:hover {
  transform: scale(1.1);
}

.player:not([class*="player-current-team"]) {
  opacity: 1;
  cursor: default;
}

.player-selected {
  box-shadow: 0 0 0 3px #FFC107;
}

.player-role {
  font-weight: bold;
  font-size: 1rem;
  z-index: 1;
}

.captain-star {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  color: #FFC107;
  font-size: 1rem;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.valid-move {
  background-color: rgba(76, 175, 80, 0.3) !important;
}

.ball {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  cursor: pointer;
  background-color: white;
  border-radius: 50%;
  padding: 4px;
  border: 2px solid #000;
  z-index: 2;

  &.selected {
    border: 3px solid #ffd700;
    box-shadow: 0 0 0 6px #ffd700;
  }
}

.ball.clickable {
  cursor: pointer;
}

@media (max-width: 768px) {
  .game-board-wrapper {
    padding: 0.5rem;
  }

  .game-board {
    width: 100%;
    height: calc(100vw * 1.727); /* 19:11 ratio */
  }

  .grid-labels {
    font-size: 0.6rem;
  }

  .column-labels {
    top: -1.8rem;
    height: 1rem;
  }

  .row-labels {
    left: -1rem;
    width: 0.8rem;
  }

  .player-role {
    font-size: 0.8rem;
  }

  .captain-star {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .game-board-wrapper {
    padding: 0.25rem;
  }

  .grid-labels {
    font-size: 0.5rem;
  }

  .column-labels {
    top: -1.5rem;
    height: 0.8rem;
  }

  .row-labels {
    left: -0.8rem;
    width: 0.6rem;
  }

  .player-role {
    font-size: 0.6rem;
  }

  .captain-star {
    font-size: 0.6rem;
    top: -0.3rem;
    right: -0.3rem;
  }
}

.cell {
  position: relative;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &.valid-move {
    background-color: rgba(0, 255, 0, 0.2);
    cursor: pointer;
  }
}

.player {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
  transition: transform 0.2s;

  &.blue {
    background-color: #3b82f6;
  }

  &.red {
    background-color: #ef4444;
  }

  &.captain::after {
    content: 'C';
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #fbbf24;
    color: black;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.ball {
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  z-index: 2;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
}

.help-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #1976D2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.help-button:hover {
  background-color: #1565C0;
}

.help-icon {
  width: 24px;
  height: 24px;
  background-color: white;
  color: #1976D2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}
</style>
