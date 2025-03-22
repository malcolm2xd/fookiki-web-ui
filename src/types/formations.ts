import type { Position } from './player'

// Convert from letter-number format (e.g., '3A') to Position
function parsePosition(coord: string): Position {
  const col = coord.charAt(1).charCodeAt(0) - 65 // Convert A-J to 0-9
  const row = parseInt(coord.charAt(0)) - 1 // Convert 1-16 to 0-15
  return { row, col }
}

export interface Formation {
  name: string
  description: string
  positions: {
    G: string[]  // 1 Goalkeeper
    D: string[]  // 4 Defenders
    M: string[]  // 4 Midfielders
    F: string[]  // 2 Forwards
  }
}

export const FORMATIONS: Record<string, Formation> = {
  'malformation': {
    name: 'Mal-formation',
    description: 'Custom experimental formation',
    positions: {
      G: ['1E'],
      D: [
        '3B', // Left back
        '4I', // Right back
        '5D', // Left center back
        '6G'  // Right center back
      ],
      M: [
        '6B', // Left mid
        '6E', // Center mid
        '7D', // Right mid
        '8J'  // Attacking mid
      ],
      F: [
        '8E', // Fixed forward at E8
        '13E'  // Second forward
      ]
    }
  },
  '4-4-2-diamond': {
    name: '4-4-2 Diamond',
    description: 'Classic formation with diamond midfield',
    positions: {
      G: ['1E'],
      D: [
        '3B', // Left back
        '3D', // Left center back
        '3G', // Right center back
        '3I'  // Right back
      ],
      M: [
        '5E', // Defensive mid
        '6C', // Left mid
        '6G', // Right mid
        '7E'  // Attacking mid
      ],
      F: [
        '8E', // Fixed forward at E8
        '8G'  // Right striker
      ]
    }
  },
  '4-4-2-flat': {
    name: '4-4-2 Flat',
    description: 'Traditional formation with flat midfield line',
    positions: {
      G: ['1E'],
      D: [
        '3B', // Left back
        '3D', // Left center back
        '3G', // Right center back
        '3I'  // Right back
      ],
      M: [
        '6B', // Left mid
        '6D', // Left center mid
        '6G', // Right center mid
        '6I'  // Right mid
      ],
      F: [
        '8E', // Fixed forward at E8
        '8G'  // Right striker
      ]
    }
  },
  '4-1-3-2': {
    name: '4-1-3-2',
    description: 'Balanced formation with holding midfielder',
    positions: {
      G: ['1E'],
      D: [
        '3B', // Left back
        '3D', // Left center back
        '3G', // Right center back
        '3I'  // Right back
      ],
      M: [
        '5E', // Defensive mid
        '6C', // Left mid
        '6E', // Center mid
        '6G'  // Right mid
      ],
      F: [
        '8E', // Fixed forward at E8
        '8G'  // Right striker
      ]
    }
  },
  '4-2-2-2': {
    name: '4-2-2-2',
    description: 'Box formation with double pivot',
    positions: {
      G: ['1E'],
      D: [
        '3B', // Left back
        '3D', // Left center back
        '3G', // Right center back
        '3I'  // Right back
      ],
      M: [
        '5D', // Left defensive mid
        '5G', // Right defensive mid
        '7D', // Left attacking mid
        '7G'  // Right attacking mid
      ],
      F: [
        '8E', // Fixed forward at E8
        '8G'  // Right striker
      ]
    }
  }
} 