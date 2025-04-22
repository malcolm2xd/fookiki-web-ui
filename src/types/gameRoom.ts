import type { GamePlayer } from './game'

export type Team = 'blue' | 'red'

export type Position = {
  row: number
  col: number
}

// Represents a player's position and additional board-specific information
export interface BoardPlayerPosition {
  uid: string
  position: Position
  role?: 'G' | 'D' | 'M' | 'F'
}

export interface GameRoom {
  id: string
  name: string
  mode: string
  players: {
    [team in Team]: GamePlayer[]
  }
  currentTurn: Team
  gameState: 'waiting' | 'in_progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}
