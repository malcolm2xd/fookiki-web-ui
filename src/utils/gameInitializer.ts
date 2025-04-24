import { GameState, GameRoom, GamePlayer, GameRoomStatus } from '../types/game';
import { FORMATIONS } from '../types/formations';

export function initializeGameState(formationKey: string): GameState {
  console.log('Initializing game state with formation:', formationKey)
  const formation = FORMATIONS.find(f => f.name === formationKey);
  if (!formation) {
    throw new Error(`Formation ${formationKey} not found`);
  }
  console.log(formation)
  const board =  {
    board: {
      blue: {
        G: formation.positions.G.map(pos => pos),
        D: formation.positions.D.map(pos => pos),
        M: formation.positions.M.map(pos => pos),
        F: formation.positions.F.map(pos => pos)
      },
      red: {
        // Mirror the blue formation, adjusting row numbers
        G: formation.positions.G.map(pos => mirrorPosition(pos)),
        D: formation.positions.D.map(pos => mirrorPosition(pos)),
        M: formation.positions.M.map(pos => mirrorPosition(pos)),
        F: formation.positions.F.map(pos => mirrorPosition(pos))
      },
      goals: {
        blue: ['0D', '0E', '0F', '0G'],
        red: ['17D', '17E', '17F', '17G']
      },
      ball:formation.ball
    },
    currentTurn: 'blue',
    moves: [],
    timestamp: Date.now()
  };
  // console.error('setting board:' + JSON.stringify(board, null, 2))
  return board
}

// export function createGameRoom(
//   players: {blue: GamePlayer, red: GamePlayer}, 
//   formationKey: string = FORMATIONS.find(f => f.default)?.name || FORMATIONS[0].name
// ): GameRoom {
//   const gameRoom: GameRoom = {
//     id: generateGameRoomId(),
//     status: 'playing' as GameRoomStatus,
//     players: {
//       [players.blue.uid]: players.blue,
//       [players.red.uid]: players.red
//     },
//     gameState: initializeGameState(formationKey),
//     settings: {
//       mode: 'timed',
//       duration: 10 * 60,  // 10 minutes default
//       formation: formationKey
//     },
//     createdAt: Date.now()
//   };

//   // Console log the entire game room object before saving
//   console.error('Game Room Object to be saved in Firebase:', JSON.stringify(gameRoom, null, 2));

//   return gameRoom;
// }

// Helper function to mirror position for red team
function mirrorPosition(pos: string): string {
  const row = parseInt(pos[0]);
  const col = pos[1];
  const mirroredRow = 17 - row;
  return `${mirroredRow}${col}`;
}

// // Simple ID generator (replace with more robust method in production)
// function generateGameRoomId(): string {
//   return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// }
