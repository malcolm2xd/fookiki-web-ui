export type GameMode = 'timed' | 'race' | 'gap' | 'infinite';

export interface GamePlayer {
  phoneNumber: string;
  ready: boolean;
  score: number;
}

export interface GameState {
  board: number[][];
  currentTurn: string; // player UID
  lastMove?: {
    from: [number, number];
    to: [number, number];
  };
  timestamp: number;
}

export interface GameRoom {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  players: {
    [uid: string]: GamePlayer;
  };
  gameState: GameState;
  settings: {
    mode: GameMode;
    duration?: number;
    goalTarget?: number;
  };
  createdAt: number;
  updatedAt: number;
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
