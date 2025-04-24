export interface Formation {
  name: string
  description: string
  default?: boolean
  positions: {
    G: string[]  // 1 Goalkeeper
    D: string[]  // 4 Defenders
    M: string[]  // 4 Midfielders
    F: string[]  // 2 Forwards
  }
  ball: string
  captains: {
    blue: string
    red: string
  }
}

export const FORMATIONS: Formation[] = [
  {
    name: 'Mal-formation',
    description: 'Custom experimental formation',
    default: true,
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
    },
    ball:'9E',
    captains: {
      blue: '6E',
      red: '11F'
    }
  },
  {
    name: '4-4-2 Diamond',
    description: 'Classic formation with diamond midfield',
    default: false,
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
        '6D', // Left mid
        '6F', // Right mid
        '7E'  // Attacking mid
      ],
      F: [
        '8E', // Left forward
        '8G'  // Right forward
      ]
    },
    ball:'9E',
    captains: {
      blue: '7E',
      red: '11F'
    }
  },
  {
    name: '4-4-2 Flat',
    description: 'Traditional formation with flat midfield line',
    default: false,
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
    },
    ball:'9E',
    captains: {
      blue: '6D',
      red: '11G'
    }
  },
  {
    name: '4-1-3-2',
    description: 'Balanced formation with holding midfielder',
    default: false,
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
    },
    ball:'9E',
    captains: {
      blue: '5E',
      red: '12F'
    }
  },
  {
    name: '4-2-2-2',
    description: 'Box formation with double pivot',
    default: false,
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
    },
    ball:'9E',
    captains: {
      blue: '7D',
      red: '10G'
    }
  }
] 