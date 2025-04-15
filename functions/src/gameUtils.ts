// Import formations from the client-side project
import { FORMATIONS } from '../../src/types/formations'

// Convert string coordinate (e.g., '3B') to [row, col]
function parseCoordinate(coord: string): [number, number] {
  const row = parseInt(coord.charAt(0)) - 1
  const col = coord.charAt(1).charCodeAt(0) - 65
  return [row, col]
}

// Utility function to create initial game board
export function createInitialGameBoard(formationName: string): {
  board: {
    blue: {
      G: string[];
      D: string[];
      M: string[];
      F: string[];
    };
    red: {
      G: string[];
      D: string[];
      M: string[];
      F: string[];
    };
    goals: {
      blue: string[];
      red: string[];
    };
  };
  currentTurn: string | null;
  lastMove?: {
    player: 'blue' | 'red';
    from: string;
    to: string;
  } | null;
  timestamp: number;
  formation?: string;
} {
  const formation = FORMATIONS.find(f => f.name === formationName)
  if (!formation) {
    throw new Error(`Formation ${formationName} not found`)
  }

  // Create initial board structure matching the GameState type
  const initialBoard = Array(8).fill(null).map(() => Array(8).fill(null))
  formation.positions.G.forEach((coord) => {
    const [row, col] = parseCoordinate(coord)
    initialBoard[row][col] = 'G'
  })
  formation.positions.D.forEach((coord) => {
    const [row, col] = parseCoordinate(coord)
    initialBoard[row][col] = 'D'
  })
  formation.positions.M.forEach((coord) => {
    const [row, col] = parseCoordinate(coord)
    initialBoard[row][col] = 'M'
  })
  formation.positions.F.forEach((coord) => {
    const [row, col] = parseCoordinate(coord)
    initialBoard[row][col] = 'F'
  })

  return {
    board: {
      blue: {
        G: formation.positions.G,
        D: formation.positions.D,
        M: formation.positions.M,
        F: formation.positions.F
      },
      red: {
        G: formation.positions.G,
        D: formation.positions.D,
        M: formation.positions.M,
        F: formation.positions.F
      },
      goals: {
        blue: [],
        red: []
      }
    },
    currentTurn: null,
    lastMove: null,
    timestamp: Date.now(),
    formation: formationName
  }
}

// Utility function to find default formation
export function getDefaultFormation(): string {
  const defaultFormation = FORMATIONS.find(f => f.default)
  return defaultFormation ? defaultFormation.name : FORMATIONS[0].name
}
