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
  };
  currentTurn: string | null;
  lastMove?: {
    player: 'blue' | 'red';
    from: string;
    to: string;
  } | null;
  timestamp: number;
}

export type GameRoomStatus = 'waiting' | 'in_progress' | 'playing' | 'finished';

export interface GameRoom {
  id: string;
  status: GameRoomStatus;
  players: {
    [uid: string]: GamePlayer;
  };
  gameState?: GameState;
  settings?: {
    mode: GameMode;
    duration?: number;
    formation?: string;
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

export interface GameConfig {
  opponent: 'local' | 'ai' | 'online';
  mode: string;
  duration: number;
  goalTarget: number;
  goalGap: number;
  formation?: string;
}
