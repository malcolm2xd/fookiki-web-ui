import { Position, PlayerType, CellType, Team } from '@/types';

/**
 * Initialize the game board
 */
export function initializeBoard(gridWidth: number, gridHeight: number): CellType[][] {
  const board: CellType[][] = [];
  
  for (let row = 0; row < gridHeight; row++) {
    const boardRow: CellType[] = [];
    for (let col = 0; col < gridWidth; col++) {
      boardRow.push({
        row,
        col,
        type: 'normal'
      });
    }
    board.push(boardRow);
  }
  
  // Mark goal areas using 2 cells for each goal post (1/3 of the height, centered)
  const goalHeight = Math.floor(gridHeight / 3);
  const middleStart = Math.floor((gridHeight - goalHeight) / 2);
  const middleEnd = middleStart + goalHeight;
  
  // We're placing goals on the sides with height=10 (left and right)
  // The goals are positioned outside the grid, but we'll mark the adjacent cells
  for (let row = middleStart; row <= middleEnd; row++) {
    // Left goal (column 0)
    board[row][0].type = 'goal';
    
    // Right goal (last column)
    board[row][gridWidth - 1].type = 'goal';
  }
  
  return board;
}

/**
 * Initialize players for both teams
 */
export function initializePlayers(gridWidth: number, gridHeight: number, playersPerTeam: number): { bluePlayers: PlayerType[], redPlayers: PlayerType[] } {
  const bluePlayers: PlayerType[] = [];
  const redPlayers: PlayerType[] = [];
  
  // Set up player roles
  // Always 1 goalkeeper, and distribute the rest among other roles
  const roles: { role: 'goalkeeper' | 'defender' | 'midfielder' | 'forward', count: number }[] = [
    { role: 'goalkeeper', count: 1 },
    { role: 'defender', count: 0 },
    { role: 'midfielder', count: 0 },
    { role: 'forward', count: 0 }
  ];
  
  // Distribute remaining players among other roles
  const remainingPlayers = playersPerTeam - 1; // minus the goalkeeper
  const minPlayersPerRole = Math.floor(remainingPlayers / 3);
  const extraPlayers = remainingPlayers % 3;
  
  roles[1].count = minPlayersPerRole + (extraPlayers > 0 ? 1 : 0); // defenders
  roles[2].count = minPlayersPerRole + (extraPlayers > 1 ? 1 : 0); // midfielders
  roles[3].count = minPlayersPerRole + (extraPlayers > 2 ? 1 : 0); // forwards
  
  // Calculate vertical spacing between players (using gridHeight for vertical distribution)
  const spacingVertical = Math.floor(gridHeight / (playersPerTeam + 1));
  
  // Create blue team players (left side)
  let bluePlayerIndex = 0;
  const blueCaptainIndex = Math.floor(Math.random() * playersPerTeam); // Randomly select captain
  
  for (const roleConfig of roles) {
    for (let i = 0; i < roleConfig.count; i++) {
      const row = spacingVertical * (bluePlayerIndex + 1);
      
      // Position players based on their roles
      let col;
      switch (roleConfig.role) {
        case 'goalkeeper':
          col = 1; // Goalkeeper close to their goal
          break;
        case 'defender':
          col = Math.floor(gridWidth / 6); // Defenders near their side
          break;
        case 'midfielder':
          col = Math.floor(gridWidth / 3); // Midfielders in the middle of their half
          break;
        case 'forward':
          col = Math.floor(gridWidth / 2) - 1; // Forwards near the center
          break;
      }
      
      bluePlayers.push({
        id: `blue-${bluePlayerIndex}`,
        team: 'blue',
        role: roleConfig.role,
        number: bluePlayerIndex + 1,
        position: { row, col },
        initialPosition: { row, col },
        isCaptain: bluePlayerIndex === blueCaptainIndex
      });
      
      bluePlayerIndex++;
    }
  }
  
  // Create red team players (right side)
  let redPlayerIndex = 0;
  const redCaptainIndex = Math.floor(Math.random() * playersPerTeam); // Randomly select captain
  
  for (const roleConfig of roles) {
    for (let i = 0; i < roleConfig.count; i++) {
      const row = spacingVertical * (redPlayerIndex + 1);
      
      // Position players based on their roles
      let col;
      switch (roleConfig.role) {
        case 'goalkeeper':
          col = gridWidth - 2; // Goalkeeper close to their goal
          break;
        case 'defender':
          col = Math.floor(gridWidth * 5 / 6); // Defenders near their side
          break;
        case 'midfielder':
          col = Math.floor(gridWidth * 2 / 3); // Midfielders in the middle of their half
          break;
        case 'forward':
          col = Math.floor(gridWidth / 2) + 1; // Forwards near the center
          break;
      }
      
      redPlayers.push({
        id: `red-${redPlayerIndex}`,
        team: 'red',
        role: roleConfig.role,
        number: redPlayerIndex + 1,
        position: { row, col },
        initialPosition: { row, col },
        isCaptain: redPlayerIndex === redCaptainIndex
      });
      
      redPlayerIndex++;
    }
  }
  
  return { bluePlayers, redPlayers };
}

/**
 * Determine the initial ball position (center of the field)
 */
export function determineInitialBallPosition(gridWidth: number, gridHeight: number): Position {
  return { 
    row: Math.floor(gridHeight / 2), 
    col: Math.floor(gridWidth / 2) 
  };
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Calculate valid moves for a player
 */
export function calculateValidPlayerMoves(
  player: PlayerType, 
  allPlayers: { blue: PlayerType[], red: PlayerType[] }, 
  ballPosition: Position, 
  gridSize: number
): Position[] {
  const validMoves: Position[] = [];
  const { row, col } = player.position;
  
  // Base movement patterns based on role
  let moveRange = 1; // Default move range is 1 cell in any direction
  let maxMoves = 8; // Default max potential moves (all 8 directions)
  
  // Captain gets enhanced movement capabilities
  if (player.isCaptain) {
    moveRange = 2; // Captains can move 2 cells in any direction
  }
  
  // Role-specific movement restrictions
  switch (player.role) {
    case 'goalkeeper':
      // Goalkeepers have limited movement
      moveRange = 1;
      maxMoves = 4; // Can only move up/down/left/right (no diagonals)
      break;
    
    case 'defender':
      // Defenders are solid but not fast
      moveRange = player.isCaptain ? 2 : 1;
      maxMoves = 8; // All directions
      break;
    
    case 'midfielder':
      // Midfielders have balanced movement
      moveRange = player.isCaptain ? 2 : 1;
      maxMoves = 8; // All directions
      break;
    
    case 'forward':
      // Forwards are fast but less defensive
      moveRange = player.isCaptain ? 3 : 2;
      maxMoves = 8; // All directions
      break;
  }
  
  // Generate all potential moves based on role and captain status
  const potentialMoves: Position[] = [];
  
  // Generate moves in all 8 directions up to the moveRange
  for (let rOffset = -moveRange; rOffset <= moveRange; rOffset++) {
    for (let cOffset = -moveRange; cOffset <= moveRange; cOffset++) {
      // Skip the current position
      if (rOffset === 0 && cOffset === 0) continue;
      
      // For goalkeeper, only allow up/down/left/right
      if (player.role === 'goalkeeper' && 
          Math.abs(rOffset) + Math.abs(cOffset) !== 1) {
        continue;
      }
      
      // Limit the total possible moves as defined by the role
      const moveIndex = (rOffset + moveRange) * (2 * moveRange + 1) + (cOffset + moveRange);
      if (moveIndex >= maxMoves) continue;
      
      potentialMoves.push({
        row: row + rOffset,
        col: col + cOffset
      });
    }
  }
  
  // Team-specific constraints 
  let teamMovementConstraint: { minCol?: number, maxCol?: number } = {};
  
  // Goalkeepers have even more restricted movement
  if (player.role === 'goalkeeper') {
    if (player.team === 'blue') {
      teamMovementConstraint.maxCol = Math.floor(gridSize / 3); // Blue goalkeeper can't go too far
    } else {
      teamMovementConstraint.minCol = Math.floor(gridSize * 2 / 3); // Red goalkeeper can't go too far
    }
  }
  
  // Check each potential move for validity
  for (const move of potentialMoves) {
    // Skip if out of bounds
    if (move.row < 0 || move.row >= gridSize || move.col < 0 || move.col >= gridSize) {
      continue;
    }
    
    // Apply team-specific movement constraints
    if ((teamMovementConstraint.minCol !== undefined && move.col < teamMovementConstraint.minCol) ||
        (teamMovementConstraint.maxCol !== undefined && move.col > teamMovementConstraint.maxCol)) {
      continue;
    }
    
    // Check if the position is already occupied by another player
    const isOccupied = [...allPlayers.blue, ...allPlayers.red].some(p => 
      p.id !== player.id && positionsEqual(p.position, move)
    );
    
    if (!isOccupied) {
      validMoves.push(move);
    }
  }
  
  return validMoves;
}

/**
 * Calculate valid moves for the ball
 */
export function calculateValidBallMoves(
  player: PlayerType, 
  allPlayers: { blue: PlayerType[], red: PlayerType[] }, 
  gridSize: number
): Position[] {
  const validMoves: Position[] = [];
  const { row, col } = player.position;
  
  // The ball can be passed in straight lines (horizontal, vertical, diagonal)
  const directions = [
    { rowDir: -1, colDir: 0 },  // up
    { rowDir: 1, colDir: 0 },   // down
    { rowDir: 0, colDir: -1 },  // left
    { rowDir: 0, colDir: 1 },   // right
    { rowDir: -1, colDir: -1 }, // up-left
    { rowDir: -1, colDir: 1 },  // up-right
    { rowDir: 1, colDir: -1 },  // down-left
    { rowDir: 1, colDir: 1 }    // down-right
  ];
  
  // Determine max pass distance based on player role and captain status
  let maxPassDistance = 3; // Default passing distance
  
  // Role-specific ball movement abilities
  switch (player.role) {
    case 'goalkeeper':
      maxPassDistance = player.isCaptain ? 4 : 3;
      break;
      
    case 'defender':
      maxPassDistance = player.isCaptain ? 4 : 3;
      break;
      
    case 'midfielder':
      maxPassDistance = player.isCaptain ? 5 : 4;
      break;
      
    case 'forward':
      maxPassDistance = player.isCaptain ? 4 : 3;
      break;
  }
  
  // Check each direction
  for (const dir of directions) {
    let r = row + dir.rowDir;
    let c = col + dir.colDir;
    
    // Check cells in that direction up to the max pass distance
    for (let dist = 1; dist <= maxPassDistance; dist++) {
      // Skip if out of bounds
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
        break;
      }
      
      // Check if another player is at this position
      const playerAtPosition = [...allPlayers.blue, ...allPlayers.red].find(p => 
        positionsEqual(p.position, { row: r, col: c })
      );
      
      if (playerAtPosition) {
        // Can pass to a player of the same team
        if (playerAtPosition.team === player.team) {
          // Midfielders can make more accurate passes
          if (player.role === 'midfielder' || player.isCaptain) {
            validMoves.push({ row: r, col: c });
          } else if (dist <= 2) {
            // Other roles have more limited accurate passing
            validMoves.push({ row: r, col: c });
          }
        }
        
        // Cannot pass through opponents
        break;
      } else {
        // No player at this position, it's a valid move
        validMoves.push({ row: r, col: c });
      }
      
      // Move to the next cell in this direction
      r += dir.rowDir;
      c += dir.colDir;
    }
  }
  
  // If player is a forward and near the goal, add shooting capability
  if (player.role === 'forward') {
    const isNearEnemyGoal = (player.team === 'blue' && col > Math.floor(gridSize * 2/3)) || 
                           (player.team === 'red' && col < Math.floor(gridSize/3));
    
    if (isNearEnemyGoal) {
      // Add direct shots at the goal
      const goalCol = player.team === 'blue' ? gridSize - 1 : 0;
      const middleStart = Math.floor(gridSize / 3);
      const middleEnd = Math.floor(gridSize * 2 / 3);
      
      // Add possible goal shots
      for (let goalRow = middleStart; goalRow <= middleEnd; goalRow++) {
        // Check if path to goal is clear
        let canShoot = true;
        const rowStep = (goalRow - row) / Math.max(Math.abs(goalRow - row), 1);
        const colStep = (goalCol - col) / Math.max(Math.abs(goalCol - col), 1);
        
        let r = row + rowStep;
        let c = col + colStep;
        
        // Check path to goal
        while (r !== goalRow || c !== goalCol) {
          if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) {
            canShoot = false;
            break;
          }
          
          // Check if another player is blocking the shot
          const isBlocked = [...allPlayers.blue, ...allPlayers.red].some(p => 
            positionsEqual(p.position, { row: Math.floor(r), col: Math.floor(c) })
          );
          
          if (isBlocked) {
            canShoot = false;
            break;
          }
          
          r += rowStep;
          c += colStep;
        }
        
        if (canShoot) {
          validMoves.push({ row: goalRow, col: goalCol });
        }
      }
    }
  }
  
  return validMoves;
}

/**
 * Check if a goal has been scored
 */
export function isGoalScored(ballPosition: Position, gridWidth: number): { scored: boolean, team: Team | null } {
  const middleStart = Math.floor(10 / 3); // Using 10 for height
  const middleEnd = Math.floor(10 * 2 / 3);
  
  // Left goal (scored by red team)
  // The goal is now outside the grid (left), so the ball position would be at col === -1
  if (
    ballPosition.col === 0 && 
    ballPosition.row >= middleStart && 
    ballPosition.row <= middleEnd
  ) {
    // We still use col === 0 for detection since the ball can't actually go outside the grid
    return { scored: true, team: 'red' };
  }
  
  // Right goal (scored by blue team)
  // The goal is now outside the grid (right), so the ball position would be at col === gridWidth
  if (
    ballPosition.col === gridWidth - 1 && 
    ballPosition.row >= middleStart && 
    ballPosition.row <= middleEnd
  ) {
    // We still use col === gridWidth-1 for detection since the ball can't actually go outside the grid
    return { scored: true, team: 'blue' };
  }
  
  return { scored: false, team: null };
}

/**
 * Reset players to their initial positions
 */
export function resetPlayersToInitialPositions(
  players: { blue: PlayerType[], red: PlayerType[] },
  gridSize: number
): void {
  // Reset blue team
  for (let i = 0; i < players.blue.length; i++) {
    players.blue[i].position = { ...players.blue[i].initialPosition };
  }
  
  // Reset red team
  for (let i = 0; i < players.red.length; i++) {
    players.red[i].position = { ...players.red[i].initialPosition };
  }
}
