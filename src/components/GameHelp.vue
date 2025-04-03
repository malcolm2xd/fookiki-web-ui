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
              <div class="player-info">
                <div class="player-header">
                  <div class="player-icon player-blue">F</div>
                  <h4>Forward (F) - 2 players</h4>
                </div>
                <div class="player-details">
                  <div class="info-section">
                    <h5>Properties</h5>
                    <ul>
                      <li>Can move past midfielders</li>
                      <li>4 cells forward, 1 cell back</li>
                      <li>2 cells horizontally</li>
                    </ul>
                  </div>
                  <div class="movement-section">
                    <h5>Player Movement</h5>
                    <div class="grid grid-5x5">
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div class="move">←</div>
                      <div class="move">←</div>
                      <div class="player">F</div>
                      <div class="move">→</div>
                      <div class="move">→</div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                  <div class="ball-section">
                    <h5>Ball Movement</h5>
                    <div class="grid grid-5x5">
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div class="move">←</div>
                      <div class="move">←</div>
                      <div class="player">F</div>
                      <div class="move">→</div>
                      <div class="move">→</div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="player-type">
              <div class="player-info">
                <div class="player-header">
                  <div class="player-icon player-blue">M</div>
                  <h4>Midfielder (M) - 4 players</h4>
                </div>
                <div class="player-details">
                  <div class="info-section">
                    <h5>Properties</h5>
                    <ul>
                      <li>Can move past any opponent</li>
                      <li>2 cells diagonally</li>
                    </ul>
                  </div>
                  <div class="movement-section">
                    <h5>Player Movement</h5>
                    <div class="grid grid-5x5">
                      <div class="move">↖</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↗</div>
                      <div></div>
                      <div class="move">↖</div>
                      <div></div>
                      <div class="move">↗</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="player">M</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↙</div>
                      <div></div>
                      <div class="move">↘</div>
                      <div></div>
                      <div class="move">↙</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↘</div>
                    </div>
                  </div>
                  <div class="ball-section">
                    <h5>Ball Movement</h5>
                    <div class="grid grid-5x5">
                      <div class="move">↖</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↗</div>
                      <div></div>
                      <div class="move">↖</div>
                      <div></div>
                      <div class="move">↗</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="player">M</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↙</div>
                      <div></div>
                      <div class="move">↘</div>
                      <div></div>
                      <div class="move">↙</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↘</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="player-type">
              <div class="player-info">
                <div class="player-header">
                  <div class="player-icon player-blue">D</div>
                  <h4>Defender (D) - 4 players</h4>
                </div>
                <div class="player-details">
                  <div class="info-section">
                    <h5>Properties</h5>
                    <ul>
                      <li>Can move past defenders and midfielders</li>
                      <li>2 cells horizontally</li>
                      <li>1 cell vertically</li>
                    </ul>
                  </div>
                  <div class="movement-section">
                    <h5>Player Movement</h5>
                    <div class="grid grid-5x5">
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div class="move">←</div>
                      <div class="move">←</div>
                      <div class="player">D</div>
                      <div class="move">→</div>
                      <div class="move">→</div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                  <div class="ball-section">
                    <h5>Ball Movement</h5>
                    <div class="grid grid-5x5">
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div class="move">←</div>
                      <div class="move">←</div>
                      <div class="player">D</div>
                      <div class="move">→</div>
                      <div class="move">→</div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="player-type">
              <div class="player-info">
                <div class="player-header">
                  <div class="player-icon player-blue">G</div>
                  <h4>Goalkeeper (G) - 1 player</h4>
                </div>
                <div class="player-details">
                  <div class="info-section">
                    <h5>Properties</h5>
                    <ul>
                      <li>Cannot move past any opponent</li>
                      <li>1 cell in any direction</li>
                      <li>3 cells straight for ball movement</li>
                    </ul>
                  </div>
                  <div class="movement-section">
                    <h5>Player Movement</h5>
                    <div class="grid grid-3x3">
                      <div class="move">↖</div>
                      <div class="move">↑</div>
                      <div class="move">↗</div>
                      <div class="move">←</div>
                      <div class="player">G</div>
                      <div class="move">→</div>
                      <div class="move">↙</div>
                      <div class="move">↓</div>
                      <div class="move">↘</div>
                    </div>
                  </div>
                  <div class="ball-section">
                    <h5>Ball Movement</h5>
                    <div class="grid grid-5x5">
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↑</div>
                      <div></div>
                      <div></div>
                      <div class="move">←</div>
                      <div class="move">←</div>
                      <div class="player">G</div>
                      <div class="move">→</div>
                      <div class="move">→</div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div class="move">↓</div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.player-type {
  background-color: white;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.player-details {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.info-section h5,
.movement-section h5,
.ball-section h5 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 0.95rem;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
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

.player-header h4 {
  margin: 0;
  color: #2c3e50;
}

.player-info ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.player-info li {
  margin: 0.25rem 0;
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

.movement-grids {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.movement-grid h4 {
  text-align: center;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.grid {
  display: grid;
  gap: 2px;
  margin: 1rem 0;
}

.grid-3x3 {
  grid-template-columns: repeat(3, 1fr);
  width: 90px;
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