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
        <button 
          class="opponent-button"
          @click="selectOpponent('online')"
          :class="{ active: selectedOpponent === 'online' }"
        >
          <div class="opponent-icon">🌐</div>
          <div class="opponent-info">
            <h3>Online</h3>
            <p>Play against others online</p>
          </div>
        </button>
        <button 
          class="opponent-button"
          @click="selectOpponent('local')"
          :class="{ active: selectedOpponent === 'local' }"
        >
          <div class="opponent-icon">👥</div>
          <div class="opponent-info">
            <h3>Same Screen</h3>
            <p>Play against a friend on this device</p>
          </div>
        </button>
        <button 
          class="opponent-button"
          @click="selectOpponent('same_screen_online')"
          :class="{ active: selectedOpponent === 'same_screen_online' }"
        >
          <div class="opponent-icon">🌐👥</div>
          <div class="opponent-info">
            <h3>Online Same Screen</h3>
            <p>Play with a friend online on the same screen</p>
          </div>
        </button>

      </div>
    </div>
    
    <div class="main-config">
      <!-- Game Modes Panel -->
      <div class="config-panel modes-panel">
        <h2>Game Mode</h2>
        <div class="mode-selector">
          <button 
            class="mode-button"
            @click="selectMode('timed')"
            :class="{ active: selectedMode === 'timed' }"
          >
            Most Goals in Time
          </button>
          <button 
            class="mode-button"
            @click="selectMode('race')"
            :disabled="!modeEnabled.race"
            :class="{ 
              active: selectedMode === 'race',
              disabled: !modeEnabled.race 
            }"
            :title="modeEnabled.race ? '' : 'Coming soon!'"
          >
            Race to Goals
          </button>
          <button 
            class="mode-button"
            @click="selectMode('gap')"
            :disabled="!modeEnabled.gap"
            :class="{ 
              active: selectedMode === 'gap',
              disabled: !modeEnabled.gap 
            }"
            :title="modeEnabled.gap ? '' : 'Coming soon!'"
          >
            Goal Gap
          </button>
          <button 
            class="mode-button"
            @click="selectMode('infinite')"
            :disabled="!modeEnabled.infinite"
            :class="{ 
              active: selectedMode === 'infinite',
              disabled: !modeEnabled.infinite 
            }"
            :title="modeEnabled.infinite ? '' : 'Coming soon!'"
          >
            Infinite
          </button>
        </div>
      </div>

      <!-- Mode Settings Panel -->
      <div class="config-panel settings-panel">
        <h2>Mode Settings</h2>
        
        <!-- Timed Mode Settings -->
        <div v-if="selectedMode === 'timed'" class="mode-settings">
          <h3>Game Duration</h3>
          <div class="duration-selector">
            <button 
              v-for="duration in gameDurations" 
              :key="duration"
              :class="{ active: selectedDuration === duration }"
              @click="selectDuration(duration)"
              class="setting-button"
            >
              {{ formatDuration(duration) }}
            </button>
          </div>
        </div>

        <!-- Race Mode Settings -->
        <div v-if="selectedMode === 'race'" class="mode-settings">
          <h3>Goals to Win</h3>
          <div class="goals-selector">
            <button 
              v-for="count in goalCounts" 
              :key="count"
              :class="{ active: selectedGoalCount === count }"
              @click="selectGoalCount(count)"
              class="setting-button"
            >
              {{ count }} Goals
            </button>
          </div>
        </div>

        <!-- Gap Mode Settings -->
        <div v-if="selectedMode === 'gap'" class="mode-settings">
          <h3>Goal Difference</h3>
          <div class="gap-selector">
            <button 
              v-for="gap in goalGaps" 
              :key="gap"
              :class="{ active: selectedGap === gap }"
              @click="selectGap(gap)"
              class="setting-button"
            >
              {{ gap }} Goals
            </button>
          </div>
        </div>

        <!-- Infinite Mode has no settings -->
        <div v-if="selectedMode === 'infinite'" class="mode-settings">
          <p class="info-text">Play until you decide to stop!</p>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h2>Formation</h2>
      <FormationSelector />
    </div>

    <div class="config-section">
      <h2>Turn Timer</h2>
      <div class="timer-config">
        <div class="timer-toggle">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="turnTimerEnabled"
              @change="updateTurnTimer"
            >
            <span class="slider"></span>
          </label>
          <span>Enable Turn Timer</span>
        </div>
        
        <div class="turn-duration" v-if="turnTimerEnabled">
          <label>Turn Duration:</label>
          <select v-model="turnDuration" @change="updateTurnTimer">
            <option v-for="duration in turnDurations" 
                    :key="duration" 
                    :value="duration">
              {{ duration }} seconds
            </option>
          </select>
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
import { useAuthStore } from '@/stores/auth'
import { useGameRoomStore } from '@/stores/gameRoom'
import { GameRoom, MatchRequest, GamePlayer, GameConfig } from '@/types/game'

type GameMode = 'timed' | 'race' | 'gap' | 'infinite'
import FormationSelector from './FormationSelector.vue'

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
const turnDurations = [5, 10, 15, 20]

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
  console.log('Starting game...')
  
  const opponent = selectedOpponent.value
  
  if (opponent === 'same_screen_online') {
    try {
      // Validate game mode
      if (selectedMode.value === 'infinite') {
        throw new Error('Infinite mode is not supported for online play')
      }

      // Create a game room for same-screen online mode
      const gameRoom: GameRoom = {
        id: '', // Firebase will generate this
        status: 'waiting',
        players: {
          [authStore.user?.uid || '']: {
            uid: authStore.user?.uid || '',
            phoneNumber: authStore.user?.phoneNumber || '',
            displayName: displayName.value,
            color: 'blue', // First player is blue
            ready: true,
            score: 0
          }
        },
        settings: {
          mode: selectedMode.value,
          ...(selectedMode.value === 'timed' && { duration: selectedDuration.value }),
          ...(selectedMode.value === 'race' && { goalTarget: selectedGoalCount.value }),
          ...(selectedMode.value === 'gap' && { goalGap: selectedGap.value }),
          formation: gameStore.gameConfig.formation
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // Update game configuration
      gameStore.gameConfig = {
        opponent: selectedOpponent.value === 'same_screen_online' ? 'online' : selectedOpponent.value,
        mode: selectedMode.value,
        duration: selectedMode.value === 'timed' ? selectedDuration.value : 0,
        goalTarget: selectedMode.value === 'race' ? selectedGoalCount.value : 0,
        goalGap: selectedMode.value === 'gap' ? selectedGap.value : 0,
        formation: gameStore.gameConfig.formation
      }

      // Set timer and game configurations
      switch (selectedMode.value) {
        case 'timed':
          gameStore.timerConfig.gameDuration = selectedDuration.value
          break
      }

      // Create game room
      const roomId = await gameRoomStore.createGameRoom(gameRoom)

      // Navigate to room
      router.push(`/game/${roomId}`)
    } catch (error) {
      console.error('Same screen online game setup error:', error)
      // Handle error (show toast, etc)
    }
  } else if (opponent === 'online') {
    try {
      // Start matchmaking
      // Only timed and race modes are supported for online play
      if (selectedMode.value !== 'timed' && selectedMode.value !== 'race') {
        throw new Error('Only timed and race modes are supported for online play')
      }
      
      // Update game configuration
      gameStore.gameConfig = {
        opponent: 'online',
        mode: selectedMode.value,
        duration: selectedMode.value === 'timed' ? selectedDuration.value : 0,
        goalTarget: selectedMode.value === 'race' ? selectedGoalCount.value : 0,
        goalGap: 0,
        formation: gameStore.gameConfig.formation
      }

      // Set timer
      if (selectedMode.value === 'timed') {
        gameStore.timerConfig.gameDuration = selectedDuration.value
      }

      // Matchmaking
      await gameRoomStore.findMatch({
        mode: selectedMode.value,
        ...(selectedMode.value === 'timed' && { duration: selectedDuration.value }),
        ...(selectedMode.value === 'race' && { goalTarget: selectedGoalCount.value })
      })
      const matchRoomId = await gameRoomStore.findMatch({
        mode: selectedMode.value,
        ...(selectedMode.value === 'timed' && { duration: selectedDuration.value }),
        ...(selectedMode.value === 'race' && { goalTarget: selectedGoalCount.value })
      })
      router.push(`/game/${matchRoomId}`)
    } catch (error) {
      console.error('Matchmaking error:', error)
      // Handle error (show toast, etc)
    }
  } else {
    // Local game
    gameStore.gameConfig.opponent = opponent
    gameStore.gameConfig.mode = selectedMode.value

    switch (selectedMode.value) {
      case 'timed':
        gameStore.gameConfig.duration = selectedDuration.value
        gameStore.timerConfig.gameDuration = selectedDuration.value
        break
      case 'race':
        gameStore.gameConfig.goalTarget = selectedGoalCount.value
        break
      case 'gap':
        gameStore.gameConfig.goalGap = selectedGap.value
        break
    }
    
    // Initialize and start the game
    gameStore.initializeGame()
    router.push('/selfgame')
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
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  font-size: 1.5rem;
  transition: color 0.2s;
}

.logout-btn:hover {
  color: #2c3e50;
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

input:checked + .slider {
  background-color: #4CAF50;
}

input:checked + .slider:before {
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
