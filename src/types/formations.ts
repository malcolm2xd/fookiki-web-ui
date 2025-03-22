import type { Position } from './player'

export interface Formation {
  name: string
  description: string
  positions: {
    G: Position[]  // 1 Goalkeeper
    D: Position[]  // 4 Defenders
    M: Position[]  // 4 Midfielders
    F: Position[]  // 2 Forwards
  }
}

export const FORMATIONS: Record<string, Formation> = {
  'malformation': {
    name: 'Malformation',
    description: 'Custom experimental formation',
    positions: {
      G: [{ row: 0, col: 4 }],
      D: [
        { row: 2, col: 1 }, // 3B
        { row: 3, col: 8 }, // 4I
        { row: 4, col: 3 }, // 5D
        { row: 5, col: 6 }  // 6G
      ],
      M: [
        { row: 5, col: 1 }, // 6B
        { row: 5, col: 4 }, // 6E
        { row: 6, col: 3 }, // 7G
        { row: 7, col: 9 }  // 8J
      ],
      F: [
        { row: 7, col: 4 }, // E8 (fixed position)
        { row: 6, col: 6 }  // G8
      ]
    }
  },
  '4-4-2-diamond': {
    name: '4-4-2 Diamond',
    description: 'Classic formation with diamond midfield',
    positions: {
      G: [{ row: 0, col: 4 }],
      D: [
        { row: 2, col: 1 },  // Left back
        { row: 2, col: 3 },  // Left center back
        { row: 2, col: 6 },  // Right center back
        { row: 2, col: 8 }   // Right back
      ],
      M: [
        { row: 4, col: 4 },  // Defensive mid
        { row: 5, col: 2 },  // Left mid
        { row: 5, col: 6 },  // Right mid
        { row: 6, col: 4 }   // Attacking mid
      ],
      F: [
        { row: 7, col: 4 },  // E8 (fixed position)
        { row: 7, col: 6 }   // Right striker
      ]
    }
  },
  '4-4-2-flat': {
    name: '4-4-2 Flat',
    description: 'Traditional formation with flat midfield line',
    positions: {
      G: [{ row: 0, col: 4 }],
      D: [
        { row: 2, col: 1 },  // Left back
        { row: 2, col: 3 },  // Left center back
        { row: 2, col: 6 },  // Right center back
        { row: 2, col: 8 }   // Right back
      ],
      M: [
        { row: 5, col: 1 },  // Left mid
        { row: 5, col: 3 },  // Left center mid
        { row: 5, col: 6 },  // Right center mid
        { row: 5, col: 8 }   // Right mid
      ],
      F: [
        { row: 7, col: 4 },  // E8 (fixed position)
        { row: 7, col: 6 }   // Right striker
      ]
    }
  },
  '4-1-3-2': {
    name: '4-1-3-2',
    description: 'Balanced formation with holding midfielder',
    positions: {
      G: [{ row: 0, col: 4 }],
      D: [
        { row: 2, col: 1 },  // Left back
        { row: 2, col: 3 },  // Left center back
        { row: 2, col: 6 },  // Right center back
        { row: 2, col: 8 }   // Right back
      ],
      M: [
        { row: 4, col: 4 },  // Defensive mid
        { row: 5, col: 2 },  // Left mid
        { row: 5, col: 4 },  // Center mid
        { row: 5, col: 6 }   // Right mid
      ],
      F: [
        { row: 7, col: 4 },  // E8 (fixed position)
        { row: 7, col: 6 }   // Right striker
      ]
    }
  },
  '4-2-2-2': {
    name: '4-2-2-2',
    description: 'Box formation with double pivot',
    positions: {
      G: [{ row: 0, col: 4 }],
      D: [
        { row: 2, col: 1 },  // Left back
        { row: 2, col: 3 },  // Left center back
        { row: 2, col: 6 },  // Right center back
        { row: 2, col: 8 }   // Right back
      ],
      M: [
        { row: 4, col: 3 },  // Left defensive mid
        { row: 4, col: 6 },  // Right defensive mid
        { row: 6, col: 3 },  // Left attacking mid
        { row: 6, col: 6 }   // Right attacking mid
      ],
      F: [
        { row: 7, col: 4 },  // E8 (fixed position)
        { row: 7, col: 6 }   // Right striker
      ]
    }
  }
} 