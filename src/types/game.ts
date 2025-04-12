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
  board: number[][] | string;
  currentTurn: string | null;
  lastMove?: {
    from: [number, number];
    to: [number, number];
  } | null;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  status: 'waiting' | 'in_progress' | 'playing' | 'finished';
  players: {
    [uid: string]: GamePlayer;
  };
  gameState?: GameState;
  settings?: {
    mode: GameMode;
    duration?: number;
    goalTarget?: number;
  };
  unsubscribe?: () => void;
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
