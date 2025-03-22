import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Team, Player, Position, PlayerRole, getValidMoves } from '@/types/player'
import { Formation, FORMATIONS } from '@/types/formations'

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
  const currentFormation = ref<string>('malformation')

  // Getters
  const totalDimensions = computed(() => getTotalDimensions(gridConfig.value))
  const allPlayers = computed(() => players.value)
  const bluePlayers = computed(() => players.value.filter(p => p.team === 'blue'))
  const redPlayers = computed(() => players.value.filter(p => p.team === 'red'))
  const selectedPlayer = computed(() => players.value.find(p => p.id === selectedPlayerId.value))
  const availableFormations = computed(() => Object.entries(FORMATIONS).map(([key, formation]) => ({
    key,
    name: formation.name,
    description: formation.description
  })))

  // Actions
  function setGridConfig(config: GridConfig) {
    gridConfig.value = config
    // Reset game when grid config changes
    initializeGame()
  }

  function setFormation(formationKey: string) {
    if (FORMATIONS[formationKey]) {
      currentFormation.value = formationKey
      initializeGame()
    }
  }

  function initializeGame() {
    const formation = FORMATIONS[currentFormation.value]
    if (!formation) return

    const createPlayer = (team: Team, role: PlayerRole, position: Position, id: string, isCaptain: boolean = false): Player => ({
      id,
      team,
      role,
      position: { ...position },
      initialPosition: { ...position },
      isCaptain
    })

    const bluePlayers: Player[] = [
      // Goalkeeper
      ...formation.positions.G.map((pos, i) => 
        createPlayer('blue', 'G', pos, 'blue-G', true)
      ),
      // Defenders
      ...formation.positions.D.map((pos, i) => 
        createPlayer('blue', 'D', pos, `blue-D${i + 1}`)
      ),
      // Midfielders
      ...formation.positions.M.map((pos, i) => 
        createPlayer('blue', 'M', pos, `blue-M${i + 1}`)
      ),
      // Forwards
      ...formation.positions.F.map((pos, i) => 
        createPlayer('blue', 'F', pos, `blue-F${i + 1}`)
      )
    ]

    players.value = bluePlayers
    ballPosition.value = { row: 8, col: 5 }  // F9 position
    currentTeam.value = 'blue'
    selectedPlayerId.value = null
    validMoves.value = []
    gamePhase.value = 'PLAYER_SELECTION'
    score.value = { blue: 0, red: 0 }
    winner.value = null
  }

  function selectPlayer(playerId: string) {
    const player = players.value.find(p => p.id === playerId)
    if (!player) return

    // Clear previous selection if clicking the same player
    if (selectedPlayerId.value === playerId) {
      selectedPlayerId.value = null
      validMoves.value = []
      return
    }

    selectedPlayerId.value = playerId
    // Get all possible moves
    let possibleMoves = getValidMoves(player, player.position)
    
    // Filter out moves that would land on other players
    possibleMoves = possibleMoves.filter(move => {
      // Check if any player is at this position
      const playerAtPosition = players.value.find(p => 
        p.position.row === move.row && p.position.col === move.col
      )
      
      // Check if ball is at this position
      const ballAtPosition = 
        ballPosition.value.row === move.row && 
        ballPosition.value.col === move.col

      return !playerAtPosition && !ballAtPosition
    })

    validMoves.value = possibleMoves
  }

  function movePlayer(position: Position) {
    if (!selectedPlayer.value) return
    
    const player = selectedPlayer.value
    player.position = position
    
    // Reset selection after moving
    selectedPlayerId.value = null
    validMoves.value = []
  }

  function moveBall(position: Position) {
    ballPosition.value = position
    
    // Check for goal
    if (position.col >= 4 && position.col <= 7) {
      if (position.row <= 0) {
        score.value.red++
        checkWinner()
      } else if (position.row >= 15) {
        score.value.blue++
        checkWinner()
      }
    }
    
    endTurn()
  }

  function endTurn() {
    selectedPlayerId.value = null
    validMoves.value = []
    gamePhase.value = 'PLAYER_SELECTION'
    currentTeam.value = currentTeam.value === 'blue' ? 'red' : 'blue'
  }

  function checkWinner() {
    if (score.value.blue >= 3) {
      winner.value = 'blue'
      gamePhase.value = 'GAME_OVER'
    } else if (score.value.red >= 3) {
      winner.value = 'red'
      gamePhase.value = 'GAME_OVER'
    } else {
      resetPositions()
    }
  }

  function resetPositions() {
    players.value.forEach(player => {
      player.position = { ...player.initialPosition }
    })
    ballPosition.value = { row: 7, col: 4 }
  }

  // Initialize game on store creation
  initializeGame()

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
    currentFormation,
    
    // Getters
    totalDimensions,
    allPlayers,
    bluePlayers,
    redPlayers,
    selectedPlayer,
    availableFormations,
    
    // Actions
    setGridConfig,
    initializeGame,
    selectPlayer,
    movePlayer,
    moveBall,
    resetPositions,
    setFormation
  }
}) 