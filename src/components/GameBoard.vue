<template>
  <div class="game-board-wrapper">
    <div class="game-board">
      <div class="playing-field">
        <!-- Row 1: Column Labels (A-J) -->
        <div v-for="col in totalDimensions.totalCols" :key="`col-${col}`" class="board-cell column-label">
          {{ col === 1 || col === totalDimensions.totalCols ? '' : String.fromCharCode(64 + col - 1) }}
        </div>

        <!-- Row 3: Top Goal -->
        <div v-for="col in totalDimensions.totalCols" :key="`goal-top-${col}`" >
          <div v-if="col >= 5 && col <= 8" class="goal-cell goal-cell-blue" />
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
              'is-selectable': isPlayerSelectable(row - 1, col - 1),
              'is-valid-move': isValidMoveCell(row - 1, col - 1),
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
              'field-corner-br': col === gridConfig.playingField.cols && row === gridConfig.playingField.rows
            }"
            @click="handleCellClick(row - 1, col - 1)"
          />
          <!-- Empty last column -->
          <div />
        </template>

        <!-- Bottom Goal -->
        <div v-for="col in totalDimensions.totalCols" :key="`goal-bottom-${col}`">
          <div v-if="col >= 5 && col <= 8" class="goal-cell goal-cell-red" />
        </div>
      </div>

      <!-- Players and ball -->
      <Player 
        v-for="player in allPlayers" 
        :key="player.id" 
        :player="player" 
        :is-selected="selectedPlayerId === player.id"
        :style="getPlayerPosition(player)"
        class="cell-content"
      />
      
      <Ball 
        :position="ballPosition" 
        :is-moving="ballIsMoving"
        :style="{
          position: 'absolute',
          top: `${(ballPosition.row + 3) * (100/totalDimensions.totalRows)}%`,
          left: `${(ballPosition.col + 1) * (100/totalDimensions.totalCols)}%`,
          width: `${100/totalDimensions.totalCols}%`,
          height: `${100/totalDimensions.totalRows}%`
        }"
        class="cell-content"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import Player from './Player.vue'
import Ball from './Ball.vue'
import * as Tone from 'tone'

export default defineComponent({
  name: 'GameBoard',
  components: {
    Player,
    Ball
  },
  setup() {
    const store = useGameStore()
    const ballIsMoving = ref(false)
    
    const gridConfig = computed(() => store.gridConfig)
    const totalDimensions = computed(() => store.totalDimensions)
    const players = computed(() => store.allPlayers)
    const ballPosition = computed(() => store.ballPosition)
    const currentTeam = computed(() => store.currentTeam)
    const selectedPlayerId = computed(() => store.selectedPlayerId)
    const validMoves = computed(() => store.validMoves)
    const gamePhase = computed(() => store.gamePhase)
    
    const getPlayerPosition = (player: any) => {
      const cellWidth = 100 / totalDimensions.value.totalCols
      const cellHeight = 100 / totalDimensions.value.totalRows
      return {
        top: `${(player.position.row + 2) * cellHeight}%`,
        left: `${(player.position.col + 1) * cellWidth}%`,
        width: `${cellWidth}%`,
        height: `${cellHeight}%`,
        position: 'absolute',
        transform: 'none'
      }
    }
    
    const isPlayerSelectable = (row: number, col: number) => {
      if (gamePhase.value !== 'PLAYER_SELECTION') return false
      
      const playerAtPosition = players.value.find(p => 
        p.position.row === row && 
        p.position.col === col && 
        p.team === currentTeam.value
      )
      
      return !!playerAtPosition
    }
    
    const isValidMoveCell = (row: number, col: number) => {
      if (!validMoves.value.length) return false
      
      return validMoves.value.some(move => 
        move.row === row && move.col === col
      )
    }
    
    const handleCellClick = async (row: number, col: number) => {
      console.log('handleCellClick', row, col)
      if (gamePhase.value === 'PLAYER_SELECTION') {
        const playerAtPosition = players.value.find(p => 
          p.position.row === row && 
          p.position.col === col && 
          p.team === currentTeam.value
        )
        
        if (playerAtPosition) {
          store.selectPlayer(playerAtPosition.id)
          // Play selection sound
          const synth = new Tone.Synth().toDestination()
          synth.triggerAttackRelease("C4", "32n")
        }
      } 
      else if (gamePhase.value === 'PLAYER_MOVEMENT') {
        if (isValidMoveCell(row, col)) {
          await store.movePlayer(row, col)
          
          // Play movement sound
          const synth = new Tone.Synth().toDestination()
          synth.triggerAttackRelease("E4", "32n")
        }
      }
      else if (gamePhase.value === 'BALL_MOVEMENT') {
        if (isValidMoveCell(row, col)) {
          ballIsMoving.value = true
          
          // Play ball kick sound
          const synth = new Tone.Synth().toDestination()
          synth.triggerAttackRelease("G4", "16n")
          
          setTimeout(async () => {
            await store.moveBall(row, col)
            ballIsMoving.value = false
          }, 500)
        }
      }
    }
    
    return {
      gridConfig,
      totalDimensions,
      ballPosition,
      currentTeam,
      selectedPlayerId,
      allPlayers: players,
      gamePhase,
      ballIsMoving,
      
      getPlayerPosition,
      isPlayerSelectable,
      isValidMoveCell,
      handleCellClick
    }
  }
})
</script>

<style scoped>
.game-board-wrapper {
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
}

.game-board {
  position: relative;
  width: min(100%, calc(90vh * 0.58)); /* 11:19 ratio */
  height: calc(width * 1.727); /* 19:11 ratio */
  margin: 0 auto;
  background-color: transparent;
  /* border: 4px solid #2E7D32; */
  border-radius: 8px;
  overflow: visible;
  /* box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); */
  --total-rows: v-bind(totalDimensions.totalRows);
  --total-cols: v-bind(totalDimensions.totalCols);
}

/* Grid labels */
.grid-labels {
  position: absolute;
  color: #000000;
  font-size: 0.8rem;
  font-weight: bold;
}

/* Column letters */
.column-labels {
  top: -2.5rem;
  left: 0;
  right: 0;
  height: 1.2rem;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  text-align: center;
}

.column-labels span {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Row numbers */
.row-labels {
  top: 0;
  left: -1.5rem;
  bottom: 0;
  width: 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
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
  background-color: rgba(255, 255, 255, 0.2);
}

.board-cell.is-selectable {
  background-color: rgba(255, 255, 0, 0.3);
}

.board-cell.is-valid-move {
  background-color: rgba(0, 255, 0, 0.3);
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
.board-row:nth-child(n+1):nth-child(-n+4) .board-cell:nth-child(3) {  /* Left border */
  border-left: 4px solid rgba(255, 255, 255, 0.8);
}
.board-row:nth-child(n+1):nth-child(-n+4) .board-cell:nth-child(8) { /* Right border */
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
.board-row:nth-child(n+13):nth-child(-n+16) .board-cell:nth-child(3) {  /* Left border */
  border-left: 4px solid rgba(255, 255, 255, 0.8);
}
.board-row:nth-child(n+13):nth-child(-n+16) .board-cell:nth-child(8) { /* Right border */
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
}

.cell-content {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

/* Update Player and Ball components to center in their containers */
:deep(.player-circle),
:deep(.ball-circle) {
  width: 70% !important;
  height: 70% !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Ensure the role letter is centered */
:deep(.player-role) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
