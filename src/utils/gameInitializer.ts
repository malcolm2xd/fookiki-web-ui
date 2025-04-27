import { GameState, GameBoard } from '@/types/game';
import { FORMATION } from '@/types/formations';

export function initializeGameState(ongoing_formation?:GameBoard): GameState {
  let board:GameBoard

  if(ongoing_formation) {
    board = ongoing_formation
  } else {
    board = {
      blue: {
        G: FORMATION.positions.filter(p => p.team === 'blue' && p.role === 'G').map(p => p.position),
        C: FORMATION.positions.filter(p => p.team === 'blue' && p.role === 'C').map(p => p.position),
        D: FORMATION.positions.filter(p => p.team === 'blue' && p.role === 'D').map(p => p.position),
        M: FORMATION.positions.filter(p => p.team === 'blue' && p.role === 'M').map(p => p.position),
        F: FORMATION.positions.filter(p => p.team === 'blue' && p.role === 'F').map(p => p.position)
      },
      red: {
        // Mirror the blue formation, adjusting row numbers
        G: FORMATION.positions.filter(p => p.team === 'red' && p.role === 'G').map(p => p.position),
        C: FORMATION.positions.filter(p => p.team === 'red' && p.role === 'C').map(p => p.position),
        D: FORMATION.positions.filter(p => p.team === 'red' && p.role === 'D').map(p => p.position),
        M: FORMATION.positions.filter(p => p.team === 'red' && p.role === 'M').map(p => p.position),
        F: FORMATION.positions.filter(p => p.team === 'red' && p.role === 'F').map(p => p.position)
      },
      goals: {
        blue: ['0D', '0E', '0F', '0G'],
        red: ['17D', '17E', '17F', '17G']
      },
      ball: FORMATION.ball.find(b => b.team === 'blue')?.position || ''
    }
  }

  const gameState = {
    board ,
    currentTurn: 'blue',
    moves: [],
    timestamp: Date.now()
  };
  // console.error('setting board:' + JSON.stringify(board, null, 2))
  return gameState
}
