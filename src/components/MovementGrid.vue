<!-- MovementGrid.vue -->
<template>
  <div class="grid grid-5x5">
    <template v-for="(row, rowIndex) in grid" :key="rowIndex">
      <template v-for="(cell, colIndex) in row" :key="colIndex">
        <div :class="{ 
          'move': cell?.type === 'move', 
          'player': cell?.type === 'player',
          'ball': cell?.type === 'ball'
        }">
          {{ cell?.content || '' }}
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { getValidMoves, type Player, type Position, type PlayerRole } from '../types/player'
import { useGameStore } from '../stores/game'

export default defineComponent({
  name: 'MovementGrid',
  props: {
    role: {
      type: String as () => PlayerRole,
      required: true
    },
    showBallMoves: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const gameStore = useGameStore()

    const grid = computed(() => {
      // Create a test player in the center of a 5x5 grid
      const player: Player = {
        id: 'test',
        team: 'blue',
        role: props.role,
        position: { row: 2, col: 2 },
        initialPosition: { row: 2, col: 2 },
        isCaptain: false
      }

      // Create 5x5 grid with moves
      const grid = Array(5).fill(null).map(() => Array(5).fill(null))
      
      if (props.showBallMoves) {
        // For ball moves, place the ball in center and player above it
        grid[1][2] = { type: 'player', content: props.role }
        grid[2][2] = { type: 'ball', content: '⚽' }

        // Add moves around the ball
        switch (props.role) {
          case 'G':
            // Goalkeeper: 1 cell in any direction
            grid[1][1] = { type: 'move', content: '↖' }
            grid[1][2] = { type: 'player', content: props.role }
            grid[1][3] = { type: 'move', content: '↗' }
            grid[2][1] = { type: 'move', content: '←' }
            grid[2][2] = { type: 'ball', content: '⚽' }
            grid[2][3] = { type: 'move', content: '→' }
            grid[3][1] = { type: 'move', content: '↙' }
            grid[3][2] = { type: 'move', content: '↓' }
            grid[3][3] = { type: 'move', content: '↘' }
            break

          case 'D':
            // Defender: 2 cells vertically or horizontally
            grid[1][2] = { type: 'player', content: props.role }
            grid[2][2] = { type: 'ball', content: '⚽' }
            grid[2][0] = { type: 'move', content: '←' }
            grid[2][1] = { type: 'move', content: '←' }
            grid[2][3] = { type: 'move', content: '→' }
            grid[2][4] = { type: 'move', content: '→' }
            grid[3][2] = { type: 'move', content: '↓' }
            grid[4][2] = { type: 'move', content: '↓' }
            break

          case 'M':
            // Midfielder: 2 cells diagonally in all directions
            grid[1][2] = { type: 'player', content: props.role }
            grid[2][2] = { type: 'ball', content: '⚽' }
            // First level diagonal moves
            grid[1][1] = { type: 'move', content: '↖' }
            grid[1][3] = { type: 'move', content: '↗' }
            grid[3][1] = { type: 'move', content: '↙' }
            grid[3][3] = { type: 'move', content: '↘' }
            // Second level diagonal moves
            grid[0][0] = { type: 'move', content: '↖' }
            grid[0][4] = { type: 'move', content: '↗' }
            grid[4][0] = { type: 'move', content: '↙' }
            grid[4][4] = { type: 'move', content: '↘' }
            break

          case 'F':
            // Forward: 4 cells vertically, 2 cells horizontally
            grid[1][2] = { type: 'player', content: props.role }
            grid[2][2] = { type: 'ball', content: '⚽' }
            grid[0][2] = { type: 'move', content: '↑' }
            grid[1][2] = { type: 'player', content: props.role }
            grid[2][0] = { type: 'move', content: '←' }
            grid[2][1] = { type: 'move', content: '←' }
            grid[2][3] = { type: 'move', content: '→' }
            grid[2][4] = { type: 'move', content: '→' }
            grid[3][2] = { type: 'move', content: '↓' }
            grid[4][2] = { type: 'move', content: '↓' }
            break
        }
      } else {
        // For player moves
        grid[2][2] = { type: 'player', content: props.role }

        // Get valid moves
        const moves = getValidMoves(player, player.position)
        moves.forEach(move => {
          const relativeRow = move.row - player.position.row + 2
          const relativeCol = move.col - player.position.col + 2
          if (relativeRow >= 0 && relativeRow < 5 && relativeCol >= 0 && relativeCol < 5) {
            grid[relativeRow][relativeCol] = { type: 'move', content: getArrow(relativeRow - 2, relativeCol - 2) }
          }
        })
      }

      return grid
    })

    const getArrow = (rowDiff: number, colDiff: number): string => {
      if (rowDiff < 0 && colDiff === 0) return '↑' // up
      if (rowDiff > 0 && colDiff === 0) return '↓' // down
      if (rowDiff === 0 && colDiff < 0) return '←' // left
      if (rowDiff === 0 && colDiff > 0) return '→' // right
      if (rowDiff < 0 && colDiff < 0) return '↖' // up-left
      if (rowDiff < 0 && colDiff > 0) return '↗' // up-right
      if (rowDiff > 0 && colDiff < 0) return '↙' // down-left
      if (rowDiff > 0 && colDiff > 0) return '↘' // down-right
      return ''
    }

    return {
      grid
    }
  }
})
</script>

<style scoped>
.grid {
  display: grid;
  gap: 2px;
  margin: 1rem 0;
}

.grid-5x5 {
  grid-template-columns: repeat(5, 1fr);
  width: 150px;
}

.grid div {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 1rem;
}

.grid .player {
  background-color: #4299e1;
  color: white;
  font-weight: bold;
}

.grid .move {
  background-color: #9ae6b4;
  color: #2f855a;
}

.grid .ball {
  background-color: #fbd38d;
  color: #744210;
}
</style>
