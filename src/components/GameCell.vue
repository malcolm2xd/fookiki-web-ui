<template>
  <div 
    class="game-cell" 
    :class="{
      'selectable': isSelectable,
      'valid-move': isValidMove,
      'dark': isDarkCell,
      'goal-area-left': isGoalAreaLeft,
      'goal-area-right': isGoalAreaRight
    }"
    @click="handleClick"
  >
    <div class="cell-coordinates" v-if="showCoordinates">{{ row }},{{ col }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { useStore } from 'vuex';
import { CellType } from '@/types';

export default defineComponent({
  name: 'GameCell',
  props: {
    row: {
      type: Number,
      required: true
    },
    col: {
      type: Number,
      required: true
    },
    cellData: {
      type: Object as PropType<CellType>,
      required: true
    },
    isSelectable: {
      type: Boolean,
      default: false
    },
    isValidMove: {
      type: Boolean,
      default: false
    }
  },
  emits: ['cell-click'],
  setup(props, { emit }) {
    const store = useStore();
    
    const gridSize = computed(() => store.state.game.gridSize);
    
    const showCoordinates = computed(() => {
      return store.state.game.showCoordinates;
    });
    
    const isDarkCell = computed(() => {
      return (props.row + props.col) % 2 === 1;
    });
    
    const isGoalAreaLeft = computed(() => {
      return (
        props.col === 0 && 
        props.row >= Math.floor(gridSize.value / 3) && 
        props.row <= Math.floor(gridSize.value * 2 / 3)
      );
    });
    
    const isGoalAreaRight = computed(() => {
      return (
        props.col === gridSize.value - 1 && 
        props.row >= Math.floor(gridSize.value / 3) && 
        props.row <= Math.floor(gridSize.value * 2 / 3)
      );
    });
    
    const handleClick = () => {
      emit('cell-click');
    };
    
    return {
      isDarkCell,
      isGoalAreaLeft,
      isGoalAreaRight,
      showCoordinates,
      handleClick
    };
  }
});
</script>

<style scoped>
.game-cell {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.game-cell.dark {
  background-color: rgba(0, 0, 0, 0.1);
}

.game-cell.selectable {
  cursor: pointer;
  background-color: rgba(255, 255, 0, 0.3);
  box-shadow: inset 0 0 10px rgba(255, 255, 0, 0.5);
  animation: pulse 1.5s infinite;
}

.game-cell.valid-move {
  cursor: pointer;
  background-color: rgba(0, 255, 0, 0.3);
  box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.5);
}

.game-cell.goal-area-left,
.game-cell.goal-area-right {
  background-color: rgba(255, 255, 255, 0.5);
  border: 2px dashed #333;
}

.cell-coordinates {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
}

@keyframes pulse {
  0% {
    box-shadow: inset 0 0 10px rgba(255, 255, 0, 0.5);
  }
  50% {
    box-shadow: inset 0 0 15px rgba(255, 255, 0, 0.8);
  }
  100% {
    box-shadow: inset 0 0 10px rgba(255, 255, 0, 0.5);
  }
}
</style>
