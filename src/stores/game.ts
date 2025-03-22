import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Team, Player, Position, PlayerRole, getValidMoves } from '@/types/player'
import { Formation, FORMATIONS } from '@/types/formations'

// Convert from letter-number format (e.g., '3A') to Position
function parsePosition(coord: string): Position {
  const letter = coord.slice(-1)  // Get last character (the letter)
  const number = coord.slice(0, -1)  // Get all characters except the last one (the number)
  const col = letter.charCodeAt(0) - 65  // Convert A-J to 0-9
  const row = parseInt(number) - 1  // Convert 1-16 to 0-15
  return { row, col }
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
  const ballPosition = ref<Position>({ row: 8, col: 5 }) // F9 position
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

    const createPlayer = (team: Team, role: PlayerRole, positionStr: string, id: string, isCaptain: boolean = false): Player => {
      const position = parsePosition(positionStr)
      return {
        id,
        team,
        role,
        position: { ...position },
        initialPosition: { ...position },
        isCaptain
      }
    }

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
    
    // Check for goal - only when ball is in a goal cell
    const isInGoalCell = position.col >= 3 && position.col <= 6 && (position.row === -1 || position.row === 16)
    
    if (isInGoalCell) {
      if (position.row === -1) {
        score.value.red++
        alert(`GOAL! Red team scores! Score: Blue ${score.value.blue} - ${score.value.red} Red`)
        checkWinner()
        if (!winner.value) {
          resetPositions()
        }
      } else if (position.row === 16) {
        score.value.blue++
        alert(`GOAL! Blue team scores! Score: Blue ${score.value.blue} - ${score.value.red} Red`)
        checkWinner()
        if (!winner.value) {
          resetPositions()
        }
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
    }
  }

  function resetPositions() {
    // Reset all players to their initial positions
    players.value.forEach(player => {
      player.position = { ...player.initialPosition }
    })
    // Reset ball to center (F9 position)
    ballPosition.value = { row: 8, col: 5 }
  }

  function getAdjacentPlayers(position: Position): Player[] {
    return players.value.filter(player => {
      const rowDiff = Math.abs(player.position.row - position.row)
      const colDiff = Math.abs(player.position.col - position.col)
      return (rowDiff <= 1 && colDiff <= 1) // Adjacent including diagonals
    })
  }

  function getBallMoves(player: Player): Position[] {
    const moves: Position[] = []
    const { row, col } = ballPosition.value

    // Helper to add move if within bounds and not occupied
    const addMove = (r: number, c: number) => {
      // Allow goal cells (-1 and 16 for goals)
      const isGoal = (r === -1 || r === 16) && c >= 3 && c <= 6
      const isWithinField = r >= 0 && r < gridConfig.value.playingField.rows && 
                           c >= 0 && c < gridConfig.value.playingField.cols
      
      // Check if position is valid (either within field or a goal cell)
      if (isGoal || isWithinField) {
        // Check if position is occupied by a player
        const isOccupied = players.value.some(p => 
          p.position.row === r && p.position.col === c
        )
        
        if (!isOccupied) {
          moves.push({ row: r, col: c })
        }
      }
    }

    switch (player.role) {
      case 'G':
        // Goalkeeper: 3 cells in any straight direction
        for (let i = 1; i <= 3; i++) {
          addMove(row - i, col)    // Up
          addMove(row + i, col)    // Down
          addMove(row, col - i)    // Left
          addMove(row, col + i)    // Right
        }
        break

      case 'D':
        // Defender: 2 cells vertically or horizontally
        for (let i = 1; i <= 2; i++) {
          addMove(row - i, col)    // Up
          addMove(row + i, col)    // Down
          addMove(row, col - i)    // Left
          addMove(row, col + i)    // Right
        }
        break

      case 'M':
        // Midfielder: 2 cells diagonally
        for (let i = 1; i <= 2; i++) {
          addMove(row - i, col - i)  // Up-Left
          addMove(row - i, col + i)  // Up-Right
          addMove(row + i, col - i)  // Down-Left
          addMove(row + i, col + i)  // Down-Right
        }
        break

      case 'F':
        // Forward: 4 cells vertically or 2 cells horizontally
        for (let i = 1; i <= 4; i++) {
          if (i <= 2) {
            addMove(row, col - i)    // Left
            addMove(row, col + i)    // Right
          }
          addMove(row - i, col)    // Up
          addMove(row + i, col)    // Down
        }
        break
    }

    return moves
  }

  function selectCell(position: Position) {
    // Check if there's a player at this position
    const player = players.value.find(p => 
      p.position.row === position.row && p.position.col === position.col
    )

    if (player) {
      selectPlayer(player.id)
      return
    }

    // Check if this is a valid move for the selected player
    if (selectedPlayer.value && validMoves.value.some(move => 
      move.row === position.row && move.col === position.col
    )) {
      movePlayer(position)
      return
    }

    // Check if this is a ball position and there are adjacent players
    if (position.row === ballPosition.value.row && position.col === ballPosition.value.col) {
      const adjacentPlayers = getAdjacentPlayers(position)
      if (adjacentPlayers.length > 0) {
        // Combine all possible ball moves from adjacent players
        const allBallMoves = adjacentPlayers.flatMap(player => getBallMoves(player))
        // Remove duplicates
        validMoves.value = allBallMoves.filter((move, index, self) =>
          index === self.findIndex(m => m.row === move.row && m.col === move.col)
        )
        gamePhase.value = 'BALL_MOVEMENT'
      }
      return
    }

    // Check if this is a valid ball move
    if (gamePhase.value === 'BALL_MOVEMENT' && validMoves.value.some(move =>
      move.row === position.row && move.col === position.col
    )) {
      moveBall(position)
      return
    }

    // If none of the above, clear selection
    selectedPlayerId.value = null
    validMoves.value = []
    gamePhase.value = 'PLAYER_SELECTION'
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
    setFormation,
    selectCell
  }
}) 