import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Team = 'blue' | 'red'
export interface Position {
  row: number
  col: number
}
export type PlayerRole = 'G' | 'D' | 'M' | 'F'
export type Player = {
  id: string
  team: Team
  role: PlayerRole
  position: Position
  initialPosition: Position
  isCaptain: boolean
}

// Grid configuration
export interface GridConfig {
  playingField: {
    cols: number
    rows: number
  }
  extraSpace: {
    cols: number  // Additional columns (1 for row numbers, 1 for empty column)
    rows: number  // Additional rows (1 for column labels, 1 for empty row, 1 for goals)
  }
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  playingField: {
    cols: 10,
    rows: 16
  },
  extraSpace: {
    cols: 2,  // 1 for row numbers + 1 empty column
    rows: 3   // 1 for column labels + 1 empty row + 1 for goals
  }
}

// Computed dimensions
export const getTotalDimensions = (config: GridConfig) => ({
  totalCols: config.playingField.cols + config.extraSpace.cols,
  totalRows: config.playingField.rows + config.extraSpace.rows
})

export const useGameStore = defineStore('game', () => {
  // State
  const gridConfig = ref<GridConfig>(DEFAULT_GRID_CONFIG)
  const currentTeam = ref<Team>('blue')
  const players = ref<Player[]>([])
  const ballPosition = ref<Position>({ row: 7, col: 4 }) // Center of the grid
  const selectedPlayerId = ref<string | null>(null)
  const validMoves = ref<Position[]>([])
  const gamePhase = ref<'PLAYER_SELECTION' | 'PLAYER_MOVEMENT' | 'BALL_MOVEMENT' | 'GAME_OVER'>('PLAYER_SELECTION')
  const score = ref({ blue: 0, red: 0 })
  const winner = ref<Team | null>(null)

  // Getters
  const totalDimensions = computed(() => getTotalDimensions(gridConfig.value))
  const allPlayers = computed(() => players.value)
  const bluePlayers = computed(() => players.value.filter(p => p.team === 'blue'))
  const redPlayers = computed(() => players.value.filter(p => p.team === 'red'))

  // Actions
  function setGridConfig(config: GridConfig) {
    gridConfig.value = config
    // Reset game when grid config changes
    initializeGame()
  }

  function initializeGame() {
    // Initialize players
    const bluePlayers: Player[] = []
    const redPlayers: Player[] = []
    
    // Blue team (top side)
    // Goalkeeper
    bluePlayers.push({
      id: 'blue-G',
      team: 'blue',
      role: 'G',
      position: { row: 2, col: 5 },
      initialPosition: { row: 2, col: 5 },
      isCaptain: true
    })
    
    // Defenders
    for (let i = 1; i <= 3; i++) {
      bluePlayers.push({
        id: `blue-D${i}`,
        team: 'blue',
        role: 'D',
        position: { row: 4, col: 3 + i * 1 },
        initialPosition: { row: 4, col: 3 + i * 1 },
        isCaptain: false
      })
    }
    
    // Midfielders
    for (let i = 1; i <= 3; i++) {
      bluePlayers.push({
        id: `blue-M${i}`,
        team: 'blue',
        role: 'M',
        position: { row: 6, col: 3 + i * 1 },
        initialPosition: { row: 6, col: 3 + i * 1 },
        isCaptain: false
      })
    }
    
    // Forwards
    for (let i = 1; i <= 4; i++) {
      bluePlayers.push({
        id: `blue-F${i}`,
        team: 'blue',
        role: 'F',
        position: { row: 8, col: 2 + i * 1.5 },
        initialPosition: { row: 8, col: 2 + i * 1.5 },
        isCaptain: false
      })
    }
    
    // Red team (bottom side)
    // Goalkeeper
    redPlayers.push({
      id: 'red-G',
      team: 'red',
      role: 'G',
      position: { row: 14, col: 5 },
      initialPosition: { row: 14, col: 5 },
      isCaptain: true
    })
    
    // Defenders
    for (let i = 1; i <= 3; i++) {
      redPlayers.push({
        id: `red-D${i}`,
        team: 'red',
        role: 'D',
        position: { row: 12, col: 3 + i * 1 },
        initialPosition: { row: 12, col: 3 + i * 1 },
        isCaptain: false
      })
    }
    
    // Midfielders
    for (let i = 1; i <= 3; i++) {
      redPlayers.push({
        id: `red-M${i}`,
        team: 'red',
        role: 'M',
        position: { row: 10, col: 3 + i * 1 },
        initialPosition: { row: 10, col: 3 + i * 1 },
        isCaptain: false
      })
    }
    
    // Forwards
    for (let i = 1; i <= 4; i++) {
      redPlayers.push({
        id: `red-F${i}`,
        team: 'red',
        role: 'F',
        position: { row: 8, col: 2 + i * 1.5 },
        initialPosition: { row: 8, col: 2 + i * 1.5 },
        isCaptain: false
      })
    }
    
    players.value = [...bluePlayers, ...redPlayers]
    ballPosition.value = { row: 8, col: 5 } // Center of the grid
    score.value = { blue: 0, red: 0 }
    winner.value = null
    gamePhase.value = 'PLAYER_SELECTION'
    currentTeam.value = 'blue'
  }

  function selectPlayer(playerId: string) {
    selectedPlayerId.value = playerId
    gamePhase.value = 'PLAYER_MOVEMENT'
    // Calculate valid moves here
  }

  function movePlayer(row: number, col: number) {
    if (!selectedPlayerId.value) return
    
    const player = players.value.find(p => p.id === selectedPlayerId.value)
    if (!player) return
    
    player.position = { row, col }
    gamePhase.value = 'PLAYER_SELECTION'
    selectedPlayerId.value = null
    currentTeam.value = currentTeam.value === 'blue' ? 'red' : 'blue'
  }

  function moveBall(row: number, col: number) {
    ballPosition.value = { row, col }
    gamePhase.value = 'PLAYER_SELECTION'
    currentTeam.value = currentTeam.value === 'blue' ? 'red' : 'blue'
  }

  return {
    // State
    gridConfig,
    currentTeam,
    players,
    ballPosition,
    selectedPlayerId,
    validMoves,
    gamePhase,
    score,
    winner,
    
    // Getters
    totalDimensions,
    allPlayers,
    bluePlayers,
    redPlayers,
    
    // Actions
    setGridConfig,
    initializeGame,
    selectPlayer,
    movePlayer,
    moveBall
  }
}) 