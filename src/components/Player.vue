<template>
  <div 
    class="player" 
    :class="{ 
      'team-blue': player.team === 'blue',
      'team-red': player.team === 'red',
      'is-selected': isSelected
    }"
  >
    <div class="player-circle">
      {{ player.role }}
      <span v-if="player.isCaptain" class="captain-star">★</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Player } from '@/stores/game'

export default defineComponent({
  name: 'Player',
  props: {
    player: {
      type: Object as PropType<Player>,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style scoped>
.player {
  position: absolute;
  width: 30px;
  height: 30px;
  transform: translate(-50%, -50%);
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: top 0.5s ease, left 0.5s ease;
}

.player-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  position: relative;
}

.team-blue .player-circle {
  background-color: #1976D2;
}

.team-red .player-circle {
  background-color: #D32F2F;
}

.is-selected .player-circle {
  box-shadow: 0 0 0 2px yellow;
}

.captain-star {
  position: absolute;
  top: -8px;
  right: -8px;
  color: yellow;
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .player {
    width: 25px;
    height: 25px;
  }
}
</style>
