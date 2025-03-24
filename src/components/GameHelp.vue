<template>
  <div class="help-modal" v-if="isVisible" @click.self="close">
    <div class="help-content">
      <div class="help-header">
        <h2>Game Help</h2>
        <button class="close-button" @click="close">×</button>
      </div>
      
      <div class="help-sections">
        <section class="help-section">
          <h3>Player Types</h3>
          <div class="player-types">
            <div class="player-type">
              <div class="player-icon player-blue">F</div>
              <div class="player-info">
                <h4>Forward (F)</h4>
                <p>Can move 4 cells vertically or 2 cells horizontally</p>
                <p>Can move the ball over Midfielders</p>
              </div>
            </div>
            <div class="player-type">
              <div class="player-icon player-blue">M</div>
              <div class="player-info">
                <h4>Midfielder (M)</h4>
                <p>Can move 2 cells diagonally</p>
                <p>Can move the ball over other Midfielders</p>
              </div>
            </div>
            <div class="player-type">
              <div class="player-icon player-blue">D</div>
              <div class="player-info">
                <h4>Defender (D)</h4>
                <p>Can move 2 cells vertically or horizontally</p>
                <p>Cannot move the ball over any players</p>
              </div>
            </div>
            <div class="player-type">
              <div class="player-icon player-blue">G</div>
              <div class="player-info">
                <h4>Goalkeeper (G)</h4>
                <p>Can move 3 cells in any straight direction</p>
                <p>Cannot move the ball over any players</p>
              </div>
            </div>
          </div>
        </section>

        <section class="help-section">
          <h3>Game Rules</h3>
          <ul>
            <li>Each team takes turns moving players and the ball</li>
            <li>Players can only move within their designated patterns</li>
            <li>The ball can only be moved when a player from the current team is adjacent to it</li>
            <li>Ball movement follows role-based hierarchy:
              <ul>
                <li>Forwards can move over Midfielders</li>
                <li>Midfielders can move over other Midfielders</li>
                <li>Defenders and Goalkeepers cannot move over any players</li>
              </ul>
            </li>
            <li>The ball must land in an empty space</li>
            <li>Players cannot move through or land on other players</li>
          </ul>
        </section>

        <section class="help-section">
          <h3>How to Play</h3>
          <ol>
            <li>Select a player from your team (highlighted in your team's color)</li>
            <li>Valid moves will be highlighted in green</li>
            <li>Click on a highlighted cell to move the player</li>
            <li>To move the ball:
              <ol>
                <li>Make sure you have a player adjacent to the ball</li>
                <li>Click on the ball to select it</li>
                <li>Valid ball moves will be highlighted</li>
                <li>Click on a highlighted cell to move the ball</li>
              </ol>
            </li>
            <li>End your turn when you're done moving</li>
          </ol>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GameHelp',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const close = () => {
      emit('close')
    }

    return {
      close
    }
  }
})
</script>

<style scoped>
.help-modal {
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

.help-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  color: #333;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.help-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  line-height: 1;
}

.close-button:hover {
  color: #333;
}

.help-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.help-section {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
}

.help-section h3 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

.player-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.player-type {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background-color: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.player-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.player-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.player-info p {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
}

ul, ol {
  margin: 0;
  padding-left: 1.5rem;
}

li {
  margin: 0.5rem 0;
  color: #666;
}

@media (max-width: 768px) {
  .help-content {
    margin: 1rem;
    padding: 1rem;
  }

  .player-types {
    grid-template-columns: 1fr;
  }
}
</style> 