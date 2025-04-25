export type Team = 'blue' | 'red'
export type PlayerRole = 'G' | 'D' | 'M' | 'F' | 'C'

export interface Position {
  row: number
  col: number
}

export interface Player {
  id: string
  team: Team
  role: PlayerRole
  position: Position
  initialPosition: Position
  isCaptain: boolean
}

export interface MovementRule {
  piece: {
    horizontal: number
    vertical: number
    diagonal: number
    anyDirection: boolean
  }
  ball: {
    horizontal: number
    vertical: number
    diagonal: number
    anyDirection: boolean
  }
}

export const MOVEMENT_RULES: Record<PlayerRole, MovementRule> = {
  'G': {
    piece: {
      horizontal: 1,
      vertical: 1,
      diagonal: 1,
      anyDirection: true
    },
    ball: {
      horizontal: 3,
      vertical: 3,
      diagonal: 0,
      anyDirection: false
    }
  },
  'C': {
    piece: {
      horizontal: 1,
      vertical: 1,
      diagonal: 1,
      anyDirection: true
    },
    ball: {
      horizontal: 3,
      vertical: 3,
      diagonal: 0,
      anyDirection: false
    }
  },
  'D': {
    piece: {
      horizontal: 2,
      vertical: 1,
      diagonal: 0,
      anyDirection: false
    },
    ball: {
      horizontal: 2,
      vertical: 2,
      diagonal: 0,
      anyDirection: false
    }
  },
  'M': {
    piece: {
      horizontal: 0,
      vertical: 0,
      diagonal: 2,
      anyDirection: false
    },
    ball: {
      horizontal: 0,
      vertical: 0,
      diagonal: 2,
      anyDirection: false
    }
  },
  'F': {
    piece: {
      horizontal: 2,
      vertical: 2,
      diagonal: 2,
      anyDirection: true
    },
    ball: {
      horizontal: 2,
      vertical: 4,
      diagonal: 0,
      anyDirection: false
    }
  }
}

export function getValidMoves(player: Player, currentPosition: Position): Position[] {
  const moves: Position[] = []
  const { row, col } = currentPosition
  const isBlueTeam = player.team === 'blue'
  const direction = isBlueTeam ? 1 : -1

  switch (player.role) {
    case 'F':
      // Forward movement
      moves.push(
        { row: row + (4 * direction), col }, // 4 steps towards opponent goal
        { row: row + (3 * direction), col }, // 4 steps towards opponent goal
        { row: row + (2 * direction), col }, // 4 steps towards opponent goal
        { row: row + (1 * direction), col }, // 4 steps towards opponent goal
        { row: row - direction, col }, // 1 step towards team goal
        { row, col: col + 1 }, // 1 step right
        { row, col: col - 1 }  // 1 step left
      )
      break
    default:
      const rule = MOVEMENT_RULES[player.role]
      const moveRule = rule.piece
      const validMoves: Position[] = []

      // Helper function to add valid moves
      const addMove = (row: number, col: number) => {
        if (row >= 0 && row < 16 && col >= 0 && col < 10) {
          validMoves.push({ row, col })
        }
      }

      // Regular movement rules for other players
      // Horizontal moves
      if (moveRule.horizontal > 0) {
        for (let i = 1; i <= moveRule.horizontal; i++) {
          // Right
          addMove(row, col + i)
          // Left
          addMove(row, col - i)
        }
      }

      // Vertical moves
      if (moveRule.vertical > 0) {
        for (let i = 1; i <= moveRule.vertical; i++) {
          // Up
          addMove(row - i, col)
          // Down
          addMove(row + i, col)
        }
      }

      // Diagonal moves
      if (moveRule.diagonal > 0) {
        for (let i = 1; i <= moveRule.diagonal; i++) {
          // Up-right
          addMove(row - i, col + i)
          // Up-left
          addMove(row - i, col - i)
          // Down-right
          addMove(row + i, col + i)
          // Down-left
          addMove(row + i, col - i)
        }
      }

      // Any direction (combines all moves if allowed)
      if (moveRule.anyDirection) {
        const maxDistance = Math.max(moveRule.horizontal, moveRule.vertical, moveRule.diagonal)
        for (let i = 1; i <= maxDistance; i++) {
          // All 8 directions
          addMove(row - i, col)     // Up
          addMove(row + i, col)     // Down
          addMove(row, col - i)     // Left
          addMove(row, col + i)     // Right
          addMove(row - i, col - i) // Up-left
          addMove(row - i, col + i) // Up-right
          addMove(row + i, col - i) // Down-left
          addMove(row + i, col + i) // Down-right
        }
      }

      return validMoves
  }

  return moves
} 