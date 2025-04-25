export type GameMode = 'timed' | 'race' | 'gap' | 'infinite';

export interface GamePlayer {
  uid: string;
  phoneNumber: string;
  displayName: string;
  color: 'blue' | 'red';
  ready: boolean;
  score: number;
}

export interface GameState {
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
    ball: string;
  };
  currentTurn: string | null;
  moves: {
    from: [number, number];
    to: [number, number];
    player: string;
    timestamp: number;
  }[];
  timestamp: number;
}

export type GameRoomStatus = 'waiting' | 'in_progress' | 'playing' | 'finished';

export interface GameRoom {
  id: string;
  status: GameRoomStatus;
  players: { [uid: string]: GamePlayer };
  gameState?: {
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
    timestamp: number;
  };
  settings: {
    mode: GameMode;
    duration?: number;
    goalTarget?: number;
    goalGap?: number;
  };
  createdAt?: number;
  updatedAt?: number;
}

export interface MatchRequest {
  uid: string;
  phoneNumber: string;
  timestamp: number;
  preferences: {
    mode: GameMode;
    duration?: number;
    goalTarget?: number;
  };
}

export type OpponentType = 'local' | 'ai' | 'online' | 'same_screen_online';

export interface GameConfig {
  opponent: OpponentType;
  mode: string;
  duration: number;
  goalTarget: number;
  goalGap: number;
  formation: string;
}

export interface Formation {
  name: string;
  description: string;
  default: boolean;
  positions: {
    G: string[];
    D: string[];
    M: string[];
    F: string[];
  };
  ball: string;
}
