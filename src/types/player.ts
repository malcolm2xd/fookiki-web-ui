export type Team = 'blue' | 'red'
export type PlayerRole = 'G' | 'D' | 'M' | 'F'

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

export function getValidMoves(player: Player, position: Position, isForBall: boolean = false): Position[] {
  const rule = MOVEMENT_RULES[player.role]
  const moveRule = isForBall ? rule.ball : rule.piece
  const validMoves: Position[] = []

  // Helper function to add valid moves
  const addMove = (row: number, col: number) => {
    if (row >= 0 && row < 16 && col >= 0 && col < 10) {
      validMoves.push({ row, col })
    }
  }

  // Special handling for forwards to allow combined movements
  if (player.role === 'F') {
    // Generate all possible moves in a 5x5 area centered on the player
    for (let rowDiff = -2; rowDiff <= 2; rowDiff++) {
      for (let colDiff = -2; colDiff <= 2; colDiff++) {
        // Skip current position
        if (rowDiff === 0 && colDiff === 0) continue
        
        // Add all positions within the 5x5 area
        addMove(position.row + rowDiff, position.col + colDiff)
      }
    }
    return validMoves
  }

  // Regular movement rules for other players
  // Horizontal moves
  if (moveRule.horizontal > 0) {
    for (let i = 1; i <= moveRule.horizontal; i++) {
      // Right
      addMove(position.row, position.col + i)
      // Left
      addMove(position.row, position.col - i)
    }
  }

  // Vertical moves
  if (moveRule.vertical > 0) {
    for (let i = 1; i <= moveRule.vertical; i++) {
      // Up
      addMove(position.row - i, position.col)
      // Down
      addMove(position.row + i, position.col)
    }
  }

  // Diagonal moves
  if (moveRule.diagonal > 0) {
    for (let i = 1; i <= moveRule.diagonal; i++) {
      // Up-right
      addMove(position.row - i, position.col + i)
      // Up-left
      addMove(position.row - i, position.col - i)
      // Down-right
      addMove(position.row + i, position.col + i)
      // Down-left
      addMove(position.row + i, position.col - i)
    }
  }

  // Any direction (combines all moves if allowed)
  if (moveRule.anyDirection) {
    const maxDistance = Math.max(moveRule.horizontal, moveRule.vertical, moveRule.diagonal)
    for (let i = 1; i <= maxDistance; i++) {
      // All 8 directions
      addMove(position.row - i, position.col)     // Up
      addMove(position.row + i, position.col)     // Down
      addMove(position.row, position.col - i)     // Left
      addMove(position.row, position.col + i)     // Right
      addMove(position.row - i, position.col - i) // Up-left
      addMove(position.row - i, position.col + i) // Up-right
      addMove(position.row + i, position.col - i) // Down-left
      addMove(position.row + i, position.col + i) // Down-right
    }
  }

  return validMoves
} 