export interface Position {
  row: number;
  col: number;
}

export interface CellType {
  row: number;
  col: number;
  type: 'normal' | 'goal';
}

export type Team = 'blue' | 'red';

export type PlayerRole = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

export interface PlayerType {
  id: string;
  team: Team;
  role: PlayerRole;
  number: number;
  position: Position;
  initialPosition: Position;
  isCaptain: boolean;
}

export interface GameState {
  gameStarted: boolean;
  gamePhase: 'PLAYER_SELECTION' | 'PLAYER_MOVEMENT' | 'BALL_MOVEMENT' | 'GAME_OVER';
  gridWidth: number;
  gridHeight: number;
  gridSize?: number; // For backward compatibility
  playersPerTeam: number;
  winningScore: number;
  gameMode: 'local' | 'ai';
  aiDifficulty: 'easy' | 'medium' | 'hard';
  currentTeam: Team;
  currentTurn: number;
  board: CellType[][];
  players: {
    blue: PlayerType[];
    red: PlayerType[];
  };
  ballPosition: Position;
  selectedPlayerId: string | null;
  validMoves: Position[];
  score: {
    blue: number;
    red: number;
  };
  stats: {
    moves: {
      blue: number;
      red: number;
    };
    passes: {
      blue: number;
      red: number;
    };
  };
  goalScored: boolean;
  winner: Team | null;
  showCoordinates: boolean;
  showValidMoves: boolean;
  turnHistory: any[];
}

export interface RootState {
  game: GameState;
}

export interface AiMove {
  type: 'player' | 'ball';
  playerId?: string;
  position: Position;
}
