import { AiMove, PlayerType, Position, Team } from '@/types';
import { calculateValidPlayerMoves, calculateValidBallMoves, positionsEqual } from './gameLogic';

/**
 * Get AI move based on the current game state
 */
export function getAiMove(
  players: { blue: PlayerType[], red: PlayerType[] },
  ballPosition: Position,
  gridSize: number,
  difficulty: string
): AiMove {
  // Find player with the ball
  const playerWithBall = [...players.blue, ...players.red].find(p => 
    positionsEqual(p.position, ballPosition)
  );
  
  // If AI has the ball, decide where to move it
  if (playerWithBall && playerWithBall.team === 'red') {
    return getBallMoveAI(playerWithBall, players, gridSize, difficulty);
  }
  
  // Otherwise, move a player
  return getPlayerMoveAI(players, ballPosition, gridSize, difficulty);
}

/**
 * Get AI decision for moving the ball
 */
function getBallMoveAI(
  player: PlayerType,
  players: { blue: PlayerType[], red: PlayerType[] },
  gridSize: number,
  difficulty: string
): AiMove {
  // Calculate valid ball moves
  const validMoves = calculateValidBallMoves(player, players, gridSize);
  
  if (validMoves.length === 0) {
    // No valid moves, return a dummy move (should never happen)
    return {
      type: 'ball',
      position: player.position
    };
  }
  
  // Different strategies based on difficulty
  switch (difficulty) {
    case 'easy':
      // Random move
      return {
        type: 'ball',
        position: validMoves[Math.floor(Math.random() * validMoves.length)]
      };
      
    case 'hard':
      // Prioritize moving toward the goal
      const goalPosition = { row: Math.floor(gridSize / 2), col: 0 };
      
      // Sort moves by distance to goal (closest first)
      validMoves.sort((a, b) => {
        const distA = calculateDistance(a, goalPosition);
        const distB = calculateDistance(b, goalPosition);
        return distA - distB;
      });
      
      // 80% chance to choose the best move, 20% chance for a random move
      if (Math.random() < 0.8) {
        return {
          type: 'ball',
          position: validMoves[0] // Best move
        };
      } else {
        return {
          type: 'ball',
          position: validMoves[Math.floor(Math.random() * validMoves.length)]
        };
      }
      
    case 'medium':
    default:
      // Mix of random and strategic moves
      // 50% chance to move toward the goal, 50% chance for a random move
      if (Math.random() < 0.5) {
        // Sort by distance to goal
        const sortedMoves = [...validMoves].sort((a, b) => {
          const distA = calculateDistance(a, { row: Math.floor(gridSize / 2), col: 0 });
          const distB = calculateDistance(b, { row: Math.floor(gridSize / 2), col: 0 });
          return distA - distB;
        });
        
        return {
          type: 'ball',
          position: sortedMoves[0] // Best move
        };
      } else {
        return {
          type: 'ball',
          position: validMoves[Math.floor(Math.random() * validMoves.length)]
        };
      }
  }
}

/**
 * Get AI decision for moving a player
 */
function getPlayerMoveAI(
  players: { blue: PlayerType[], red: PlayerType[] },
  ballPosition: Position,
  gridSize: number,
  difficulty: string
): AiMove {
  // Find AI players (red team)
  const aiPlayers = players.red;
  
  // Evaluate each player
  const playerMoves: { player: PlayerType, move: Position, score: number }[] = [];
  
  for (const player of aiPlayers) {
    // Calculate valid moves for this player
    const validMoves = calculateValidPlayerMoves(player, players, ballPosition, gridSize);
    
    if (validMoves.length === 0) continue;
    
    // Score each move
    for (const move of validMoves) {
      let score = 0;
      
      // Distance to ball (closer is better)
      const distanceToBall = calculateDistance(move, ballPosition);
      score -= distanceToBall * 2; // Weight distance to ball heavily
      
      // Distance to goal (closer is better if we have the ball)
      const goalPosition = { row: Math.floor(gridSize / 2), col: 0 };
      const distanceToGoal = calculateDistance(move, goalPosition);
      
      // Add move to options
      playerMoves.push({
        player,
        move,
        score
      });
    }
  }
  
  // Sort moves by score (higher is better)
  playerMoves.sort((a, b) => b.score - a.score);
  
  // Different strategies based on difficulty
  let selectedMove;
  
  switch (difficulty) {
    case 'easy':
      // Random move
      selectedMove = playerMoves[Math.floor(Math.random() * playerMoves.length)];
      break;
      
    case 'hard':
      // Almost always choose the best move
      if (Math.random() < 0.9) {
        selectedMove = playerMoves[0]; // Best move
      } else {
        // Occasionally choose a random move to add unpredictability
        selectedMove = playerMoves[Math.floor(Math.random() * playerMoves.length)];
      }
      break;
      
    case 'medium':
    default:
      // Choose from the top 50% of moves
      const topHalf = Math.max(1, Math.floor(playerMoves.length / 2));
      selectedMove = playerMoves[Math.floor(Math.random() * topHalf)];
      break;
  }
  
  if (!selectedMove) {
    // Fallback if no moves were found
    return {
      type: 'player',
      playerId: aiPlayers[0].id,
      position: aiPlayers[0].position
    };
  }
  
  return {
    type: 'player',
    playerId: selectedMove.player.id,
    position: selectedMove.move
  };
}

/**
 * Calculate distance between two positions
 */
function calculateDistance(pos1: Position, pos2: Position): number {
  const rowDiff = pos1.row - pos2.row;
  const colDiff = pos1.col - pos2.col;
  return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
}
