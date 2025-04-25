
export interface Pawn {
  team: Team
  role: PlayerRole
  position: string
  label: string
  isCaptain: boolean
}

export type Team = 'blue' | 'red'
export type PlayerRole = 'G' | 'D' | 'M' | 'F' | 'C'

export interface Formation {
  positions: Pawn[]
  ball: string
}

export const FORMATION: Formation =
{
  positions: [
    { team: 'blue', role: 'G', position: '1E', label: 'Goalkeeper', isCaptain: false },
    { team: 'blue', role: 'C', position: '3B', label: 'Captain', isCaptain: true },
    { team: 'blue', role: 'D', position: '4I', label: 'Right back', isCaptain: false },
    { team: 'blue', role: 'D', position: '5D', label: 'Left center back', isCaptain: false },
    { team: 'blue', role: 'D', position: '6G', label: 'Right center back', isCaptain: false },
    { team: 'blue', role: 'M', position: '6B', label: 'Left mid', isCaptain: false },
    { team: 'blue', role: 'M', position: '6E', label: 'Center mid', isCaptain: false },
    { team: 'blue', role: 'M', position: '7D', label: 'Right mid', isCaptain: false },
    { team: 'blue', role: 'M', position: '8J', label: 'Attacking mid', isCaptain: false },
    { team: 'blue', role: 'F', position: '8E', label: 'Forward', isCaptain: false },
    { team: 'blue', role: 'F', position: '13E', label: 'Second forward', isCaptain: false },

    { team: 'red', role: 'G', position: '16F', label: 'Goalkeeper', isCaptain: false },
    { team: 'red', role: 'C', position: '13I', label: 'Captain', isCaptain: true },
    { team: 'red', role: 'D', position: '13B', label: 'Right back', isCaptain: false },
    { team: 'red', role: 'D', position: '12G', label: 'Left center back', isCaptain: false },
    { team: 'red', role: 'D', position: '11D', label: 'Right center back', isCaptain: false },
    { team: 'red', role: 'M', position: '11F', label: 'Left mid', isCaptain: false },
    { team: 'red', role: 'M', position: '11I', label: 'Center mid', isCaptain: false },
    { team: 'red', role: 'M', position: '10G', label: 'Right mid', isCaptain: false },
    { team: 'red', role: 'M', position: '9A', label: 'Attacking mid', isCaptain: false },
    { team: 'red', role: 'F', position: '9F', label: 'Forward', isCaptain: false },
    { team: 'red', role: 'F', position: '4F', label: 'Second forward', isCaptain: false }
  ],
  ball: '9E'
}