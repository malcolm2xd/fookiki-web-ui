<!-- Game configuration landing page -->
<template>
  <div class="game-config">
    <!-- User Header -->
    <div class="user-header">
      <div class="user-info" v-if="authStore.user">
        <h2>Welcome, {{ displayName }}</h2>
        <p>{{ phoneNumber }}</p>
      </div>
      <button @click="logOut" class="logout-btn" title="Log Out">
        <span class="logout-icon">🚪</span>
      </button>
    </div>

    <h1 class="title">Fookiki Game Setup</h1>

    <!-- Opponent Selection -->
    <div class="config-section opponent-section">
      <h2>Select Opponent</h2>
      <div class="opponent-selector">
        <button class="opponent-button" @click="selectOpponent('online')"
          :class="{ active: selectedOpponent === 'online' }">
          <div class="opponent-icon">🌐</div>
          <div class="opponent-info">
            <h3>Online</h3>
            <p>Play against others online</p>
          </div>
        </button>
        <button class="opponent-button" @click="selectOpponent('local')"
          :class="{ active: selectedOpponent === 'local' }">
          <div class="opponent-icon">👥</div>
          <div class="opponent-info">
            <h3>Same Screen</h3>
            <p>Play against a friend on this device</p>
          </div>
        </button>
        <button class="opponent-button" @click="selectOpponent('same_screen_online')"
          :class="{ active: selectedOpponent === 'same_screen_online' }">
          <div class="opponent-icon">🌐👥</div>
          <div class="opponent-info">
            <h3>Online Same Screen</h3>
            <p>Play with a friend online on the same screen</p>
          </div>
        </button>

      </div>
    </div>

    <div class="main-config">
      <!-- Consolidated Settings Button -->
      <div class="config-panel settings-panel">
        <button class="all-settings-btn" @click="showAllSettingsModal = true">
          🛠️ Game Configuration
        </button>
      </div>

      <!-- All Settings Modal -->
      <div v-if="showAllSettingsModal" class="all-settings-modal">
        <div class="modal-content">
          <h2>Game Configuration</h2>
          <button class="close-modal-btn" @click="showAllSettingsModal = false">
            ✖️
          </button>

          <!-- Game Mode Selection -->
          <div class="settings-section game-mode-section">
            <h3>Game Mode</h3>
            <div class="mode-selector">
              <button class="mode-button" @click="selectMode('timed')" :class="{ active: selectedMode === 'timed' }">
                <div class="mode-icon">⏱️</div>
                <div class="mode-info">
                  <h3>Timed</h3>
                  <p>Play for a set duration</p>
                </div>
              </button>
              <button class="mode-button" @click="selectMode('race')" :class="{ active: selectedMode === 'race' }">
                <div class="mode-icon">🏁</div>
                <div class="mode-info">
                  <h3>Race</h3>
                  <p>First to score goals wins</p>
                </div>
              </button>
              <button class="mode-button" @click="selectMode('gap')" :class="{ active: selectedMode === 'gap' }">
                <div class="mode-icon">📊</div>
                <div class="mode-info">
                  <h3>Goal Gap</h3>
                  <p>Win by goal difference</p>
                </div>
              </button>
              <button class="mode-button" @click="selectMode('infinite')"
                :class="{ active: selectedMode === 'infinite' }">
                <div class="mode-icon">♾️</div>
                <div class="mode-info">
                  <h3>Infinite</h3>
                  <p>Play without time limits</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Mode-Specific Settings -->
          <div class="settings-section mode-settings">
            <h3>Mode Settings</h3>
            <!-- Timed Mode Settings -->
            <div v-if="selectedMode === 'timed'" class="duration-settings">
              <h4>Time Duration</h4>
              <div class="duration-selector">
                <button v-for="duration in [300, 600, 900]" :key="duration" @click="selectDuration(duration)"
                  :class="{ active: selectedDuration === duration }">
                  {{ formatDuration(duration) }}
                </button>
              </div>
            </div>

            <!-- Race Mode Settings -->
            <div v-if="selectedMode === 'race'" class="goal-settings">
              <h4>Goal Target</h4>
              <div class="goal-selector">
                <button v-for="count in [3, 5, 7]" :key="count" @click="selectGoalCount(count)"
                  :class="{ active: selectedGoalCount === count }">
                  {{ count }} Goals
                </button>
              </div>
            </div>

            <!-- Goal Gap Mode Settings -->
            <div v-if="selectedMode === 'gap'" class="gap-settings">
              <h4>Goal Gap</h4>
              <div class="gap-selector">
                <button v-for="gap in [1, 2, 3]" :key="gap" @click="selectGap(gap)"
                  :class="{ active: selectedGap === gap }">
                  {{ gap }} Goal Difference
                </button>
              </div>
            </div>
          </div>

          <!-- Turn Timer Settings -->
          <div class="settings-section turn-timer-section">
            <h3>Turn Timer</h3>
            <div class="turn-timer-toggle">
              <button class="open-turn-timer-modal" @click="showTurnTimerModal = true">
                🕒 Configure Turn Timer
              </button>
            </div>
          </div>

          <!-- Formation Selector -->
          <div class="settings-section formation-section">
            <h3>Formation</h3>
            <FormationSelector />
          </div>
        </div>
      </div>

      <!-- Turn Timer Modal -->
      <div v-if="showTurnTimerModal" class="turn-timer-modal">
        <div class="modal-content">
          <h2>Turn Timer Configuration</h2>
          <button class="close-modal-btn" @click="showTurnTimerModal = false">
            ✖️
          </button>

          <div class="timer-config">
            <div class="timer-toggle">
              <label class="switch">
                <input type="checkbox" v-model="turnTimerEnabled" @change="updateTurnTimer">
                <span class="slider"></span>
              </label>
              <span>Enable Turn Timer</span>
            </div>

            <div class="turn-duration" v-if="turnTimerEnabled">
              <label>Turn Duration:</label>
              <select v-model="turnDuration" @change="updateTurnTimer">
                <option v-for="duration in turnDurations" :key="duration" :value="duration">
                  {{ duration }} seconds
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Settings Modal -->
      <div v-if="showGameSettingsModal" class="game-settings-modal">
        <div class="modal-content">
          <h2>Game Settings</h2>
          <button class="close-modal-btn" @click="showGameSettingsModal = false">
            ✖️
          </button>

          <!-- Timed Mode Settings -->
          <div v-if="selectedMode === 'timed'" class="mode-settings">
            <h3>Time Duration</h3>
            <div class="duration-selector">
              <button v-for="duration in [300, 600, 900]" :key="duration" @click="selectDuration(duration)"
                :class="{ active: selectedDuration === duration }">
                {{ formatDuration(duration) }}
              </button>
            </div>
          </div>

          <!-- Race Mode Settings -->
          <div v-if="selectedMode === 'race'" class="mode-settings">
            <h3>Goal Target</h3>
            <div class="goal-selector">
              <button v-for="count in [3, 5, 7]" :key="count" @click="selectGoalCount(count)"
                :class="{ active: selectedGoalCount === count }">
                {{ count }} Goals
              </button>
            </div>
          </div>

          <!-- Goal Gap Mode Settings -->
          <div v-if="selectedMode === 'gap'" class="mode-settings">
            <h3>Goal Gap</h3>
            <div class="gap-selector">
              <button v-for="gap in [1, 2, 3]" :key="gap" @click="selectGap(gap)"
                :class="{ active: selectedGap === gap }">
                {{ gap }} Goal Difference
              </button>
            </div>
          </div>

          <!-- Formation Selector -->
          <div class="formation-settings">
            <h3>Formation</h3>
            <FormationSelector />
          </div>
        </div>
      </div>
    </div>


    <button class="start-button" @click="startGame">Start Game</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { FORMATIONS } from '@/types/formations'
import { useAuthStore } from '@/stores/auth'
import { useGameRoomStore } from '@/stores/gameRoom'
import type { GameRoom as GameRoomType } from '@/types/gameRoom'
import { GamePlayer, GameConfig } from '@/types/game'

type GameMode = 'timed' | 'race' | 'gap' | 'infinite'
import FormationSelector from '@/components/FormationSelector.vue'

const router = useRouter()
const authStore = useAuthStore()

const gameStore = useGameStore()
const gameRoomStore = useGameRoomStore()
type OpponentType = 'local' | 'ai' | 'online' | 'same_screen_online'
const selectedOpponent = ref<OpponentType>('online')
const displayName = ref('Player')
const phoneNumber = ref('')

onMounted(async () => {
  if (authStore.user) {
    displayName.value = authStore.user.phoneNumber || 'Player'
    phoneNumber.value = authStore.user.phoneNumber || 'Not provided'
  }
})

async function logOut() {
  await authStore.logOut()
  router.push('/login')
}
const selectedMode = ref<GameMode>('timed')
const selectedDuration = ref(300) // 5 minutes default
const selectedGoalCount = ref(5) // for race mode
const selectedGap = ref(2) // for gap mode
const turnTimerEnabled = ref(false)
const turnDuration = ref(10)
const showTurnTimerModal = ref(false)
const showAllSettingsModal = ref(false)
const showGameSettingsModal = ref(false)
const turnDurations = [5, 10, 15, 20, 30, 45, 60]

// Helper function to get mode icon
const getModeIcon = (mode: GameMode): string => {
  const modeIcons = {
    'timed': '⏱️',
    'race': '🏁',
    'gap': '📊',
    'infinite': '♾️'
  }
  return modeIcons[mode] || '❓'
}

// Mode availability
const modeEnabled = {
  timed: true,
  race: false,
  gap: false,
  infinite: false
}

// Available options
const gameDurations = [180, 300, 600] // 3, 5, 10 minutes
const goalCounts = [3, 5, 7, 10] // for race mode
const goalGaps = [2, 3, 4, 5] // for gap mode

function selectOpponent(type: OpponentType) {
  selectedOpponent.value = type
}

function selectMode(mode: GameMode) {
  if (modeEnabled[mode]) {
    selectedMode.value = mode
  }
}

function selectGoalCount(count: number) {
  selectedGoalCount.value = count
}

function selectGap(gap: number) {
  selectedGap.value = gap
}

function selectDuration(duration: number) {
  selectedDuration.value = duration
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes} minutes`
}

function updateTurnTimer() {
  gameStore.timerConfig.enabled = turnTimerEnabled.value
  gameStore.timerConfig.duration = turnDuration.value
}

async function startGame() {
  try {
    // Validate game configuration
    if (!authStore.user) {
      console.error('User not authenticated')
      return
    }

    // Prepare game room configuration
    const selectedFormation = gameStore.currentFormation
    
    const gameRoom: GameRoomType = {
      id: '', // Firebase will generate this
      name: `${displayName.value}'s Game`, // Add a name
      mode: selectedMode.value,
      players: {
        blue: [],
        red: []
      },
      currentTurn: 'blue', // Default initial turn
      gameState: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        mode: selectedMode.value,
        duration: selectedDuration.value,
        formation: selectedFormation
      }
    }

    // Configure game store based on mode
    gameStore.gameConfig = {
      opponent: selectedOpponent.value,
      mode: selectedMode.value,
      duration: selectedDuration.value,
      goalTarget: selectedGoalCount.value,
      goalGap: selectedGap.value,
      formation: selectedFormation
    }

    switch (selectedMode.value) {
      case 'timed':
        gameStore.timerConfig.gameDuration = selectedDuration.value
        break
      case 'race':
        gameStore.timerConfig.goalTarget = selectedGoalCount.value
        break
      case 'gap':
        gameStore.timerConfig.goalGap = selectedGap.value
        break
    }

    // Create game room
    const roomId = await gameRoomStore.createGameRoom(gameRoom)

    // Navigate to room
    router.push(`/game/${roomId}`)
  } catch (error) {
    console.error('Same screen online game setup error:', error)
  }
}
</script>

<style scoped>
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-info h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.user-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 10px;
  transition: transform 0.2s;
}

.logout-btn:hover {
  transform: scale(1.1);
}

.game-config {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.opponent-section {
  margin-bottom: 2rem;
}

.opponent-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.opponent-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.opponent-button:hover:not(.disabled) {
  background: #e9ecef;
  transform: translateY(-2px);
}

.opponent-button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.opponent-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
}

.opponent-icon {
  font-size: 2rem;
  min-width: 3rem;
  text-align: center;
}

.opponent-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.opponent-info p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.main-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.config-panel {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  height: 100%;
}

.config-panel h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.5rem;
}

.config-panel h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.2rem;
}

.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-settings {
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.duration-selector,
.goals-selector,
.gap-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.mode-button,
.setting-button {
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.mode-button:hover:not(.disabled),
.setting-button:hover:not(:disabled) {
  background: #e9ecef;
}

.mode-button.active,
.setting-button.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.mode-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
}

.info-text {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

@media (max-width: 768px) {
  .main-config {
    grid-template-columns: 1fr;
  }
}

.timer-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: #4CAF50;
}

input:checked+.slider:before {
  transform: translateX(26px);
}

.turn-duration {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.turn-duration select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.open-turn-timer-modal {
  background-color: #4a4a4a;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.open-turn-timer-modal:hover {
  background-color: #5a5a5a;
}

.turn-timer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.turn-timer-modal .modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.turn-timer-modal .close-modal-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.timer-config {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timer-toggle {
  display: flex;
  align-items: center;
  gap: 15px;
}

.timer-toggle .switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.timer-toggle .switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.timer-toggle .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.timer-toggle .slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.timer-toggle input:checked+.slider {
  background-color: #4a4a4a;
}

.timer-toggle input:checked+.slider:before {
  transform: translateX(26px);
}

.turn-duration {
  display: flex;
  align-items: center;
  gap: 15px;
}

.turn-duration select {
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.start-button {
  display: block;
  width: 100%;
  padding: 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.start-button:hover {
  background: #45a049;
}
</style>
