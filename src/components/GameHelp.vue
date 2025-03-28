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
                <h4>Forward (F) - 2 players</h4>
                <p>Movement: 4 cells vertically towards opponent goal, 1 cell vertically towards team goal, or 1 cell horizontally</p>
                <p>Ball Movement: Same as movement pattern</p>
                <p>Can only move past midfielders</p>
              </div>
            </div>
            <div class="player-type">
              <div class="player-icon player-blue">M</div>
              <div class="player-info">
                <h4>Midfielder (M) - 4 players</h4>
                <p>Movement: 2 cells diagonally</p>
                <p>Ball Movement: 2 cells diagonally</p>
                <p>Can move past any opponent</p>
              </div>
            </div>
            <div class="player-type">
              <div class="player-icon player-blue">D</div>
              <div class="player-info">
                <h4>Defender (D) - 4 players</h4>
                <p>Movement: 2 cells horizontally or 1 cell vertically</p>
                <p>Ball Movement: 2 cells vertically or horizontally</p>
                <p>Can move past defenders and midfielders only</p>
              </div>
            </div>
            <div class="player-type">
              <div class="player-icon player-blue">G</div>
              <div class="player-info">
                <h4>Goalkeeper (G) - 1 player</h4>
                <p>Movement: 1 cell in any direction</p>
                <p>Ball Movement: 3 cells in any straight direction</p>
                <p>Cannot move past any opponent</p>
              </div>
            </div>
          </div>
        </section>

        <section class="help-section">
          <h3>Game Rules</h3>
          <ul>
            <li>Each team takes turns moving players and the ball</li>
            <li>Players can only move according to their role's movement pattern</li>
            <li>The ball can only be moved by players adjacent to it</li>
            <li>Players cannot move through or onto other players</li>
            <li>Players cannot move onto the ball's position</li>
            <li>Goals can only be scored from the designated goal areas</li>
            <li>First team to score 3 goals wins</li>
            <li>Each player has 30 seconds to make their move</li>
            <li>The entire game lasts 5 minutes</li>
            <li>If move timer runs out, turn automatically switches to the other team</li>
            <li>If game timer runs out, the team with the highest score wins</li>
            <li>If scores are equal when game timer runs out, the game ends in a draw</li>
          </ul>
        </section>

        <section class="help-section">
          <h3>Opponent Interaction Matrix</h3>
          <p>This table shows which players can move past which opponents (✔️ = can move past, ❌ = cannot move past):</p>
          <table class="interaction-matrix">
            <tr>
              <th>Attacker \ Opponent</th>
              <th>Goalkeeper</th>
              <th>Defender</th>
              <th>Midfielder</th>
              <th>Forward</th>
            </tr>
            <tr>
              <td>Goalkeeper</td>
              <td>❌</td>
              <td>❌</td>
              <td>❌</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Defender</td>
              <td>❌</td>
              <td>✔️</td>
              <td>✔️</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Midfielder</td>
              <td>✔️</td>
              <td>✔️</td>
              <td>✔️</td>
              <td>✔️</td>
            </tr>
            <tr>
              <td>Forward</td>
              <td>❌</td>
              <td>❌</td>
              <td>✔️</td>
              <td>❌</td>
            </tr>
          </table>
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

        <section class="help-section">
          <h3>Game Controls</h3>
          <table class="help-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>Space</kbd></td>
                <td>Start/Pause Game</td>
              </tr>
              <tr>
                <td><kbd>R</kbd></td>
                <td>Reset Game</td>
              </tr>
              <tr>
                <td><kbd>H</kbd></td>
                <td>Toggle Help</td>
              </tr>
            </tbody>
          </table>
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

.interaction-matrix {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.interaction-matrix th,
.interaction-matrix td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: center;
}

.interaction-matrix th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.interaction-matrix tr:nth-child(even) {
  background-color: #f9f9f9;
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