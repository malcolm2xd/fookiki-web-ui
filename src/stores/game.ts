import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Position, Team, PlayerRole } from '@/types/player'
import type { GridConfig } from '@/types/grid'
import { DEFAULT_GRID_CONFIG, getTotalDimensions } from '@/types/grid'
import { FORMATIONS } from '@/types/formations'
import { getValidMoves } from '@/types/player'

// Convert from letter-number format (e.g., '3A') to Position
function parsePosition(coord: string): Position {
  const letter = coord.slice(-1)  // Get last character (the letter)
  const number = coord.slice(0, -1)  // Get all characters except the last one (the number)
  const col = letter.charCodeAt(0) - 65  // Convert A-J to 0-9
  const row = parseInt(number) - 1  // Convert 1-16 to 0-15
  return { row, col }
}

// Helper function to create a player
function createPlayer(team: Team, role: PlayerRole, positionStr: string, isCaptain: boolean = false): Player {
  const position = parsePosition(positionStr)
  return {
    id: `${team}-${role}-${positionStr}`,
    team,
    role,
    position,
    initialPosition: { ...position },
    isCaptain
  }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    gridConfig: DEFAULT_GRID_CONFIG,
    currentTeam: 'blue' as Team,
    players: [
      // Blue Team
      createPlayer('blue', 'G', '3A', true),
      createPlayer('blue', 'D', '4A'),
      createPlayer('blue', 'D', '4B'),
      createPlayer('blue', 'D', '4C'),
      createPlayer('blue', 'D', '4D'),
      createPlayer('blue', 'M', '6A'),
      createPlayer('blue', 'M', '6B'),
      createPlayer('blue', 'M', '6C'),
      createPlayer('blue', 'F', '8A'),
      createPlayer('blue', 'F', '8B'),
      createPlayer('blue', 'F', '8C'),
      // Red Team
      createPlayer('red', 'G', '14A', true),
      createPlayer('red', 'D', '13A'),
      createPlayer('red', 'D', '13B'),
      createPlayer('red', 'D', '13C'),
      createPlayer('red', 'D', '13D'),
      createPlayer('red', 'M', '11A'),
      createPlayer('red', 'M', '11B'),
      createPlayer('red', 'M', '11C'),
      createPlayer('red', 'F', '9A'),
      createPlayer('red', 'F', '9B'),
      createPlayer('red', 'F', '9C'),
    ] as Player[],
    ballPosition: { row: 8, col: 5 } as Position, // F9 position
    selectedPlayerId: null as string | null,
    validMoves: [] as Position[],
    gamePhase: 'BALL_MOVEMENT' as 'PLAYER_SELECTION' | 'PLAYER_MOVEMENT' | 'BALL_MOVEMENT' | 'GAME_OVER',
    score: { blue: 0, red: 0 },
    winner: null as Team | null,
    currentFormation: 'malformation' as string,
  }),

  getters: {
    totalDimensions: (state) => getTotalDimensions(state.gridConfig),
    allPlayers: (state) => state.players,
    bluePlayers: (state) => state.players.filter(p => p.team === 'blue'),
    redPlayers: (state) => state.players.filter(p => p.team === 'red'),
    selectedPlayer: (state) => state.players.find(p => p.id === state.selectedPlayerId),
    availableFormations: () => Object.entries(FORMATIONS).map(([key, formation]) => ({
      key,
      name: formation.name,
      description: formation.description
    })),
    getCell: (state) => (position: Position) => {
      const player = state.players.find(p => p.position.row === position.row && p.position.col === position.col);
      return {
        position,
        player,
        hasBall: state.ballPosition.row === position.row && state.ballPosition.col === position.col
      };
    },
    canMoveBall: (state) => {
      const adjacentPlayers = state.players.filter(p => 
        Math.abs(p.position.row - state.ballPosition.row) <= 1 && 
        Math.abs(p.position.col - state.ballPosition.col) <= 1
      );
      return adjacentPlayers.some(p => p.team === state.currentTeam);
    },
  },

  actions: {
    setGridConfig(config: GridConfig) {
      this.gridConfig = config
      // Reset game when grid config changes
      this.initializeGame()
    },

    setFormation(formationKey: string) {
      if (FORMATIONS[formationKey]) {
        this.currentFormation = formationKey
        this.initializeGame()
      }
    },

    initializeGame() {
      const formation = FORMATIONS[this.currentFormation]
      if (!formation) return

      // Helper function to mirror a position horizontally and vertically
      const mirrorPosition = (pos: string): string => {
        const letter = pos.slice(-1)
        const number = parseInt(pos.slice(0, -1))
        const col = letter.charCodeAt(0) - 65  // Convert A-J to 0-9
        
        // Mirror horizontally
        const mirroredCol = 9 - col  // Mirror horizontally (9 is the last column)
        const mirroredLetter = String.fromCharCode(65 + mirroredCol)  // Convert back to letter
        
        // Mirror vertically across the half line (row 8)
        // For example: 3→13, 4→12, 5→11, 6→10, 7→9, 8→8, 9→7, 10→6, 11→5, 12→4, 13→3
        const mirroredNumber = 16 - number + 1
        
        return `${mirroredNumber}${mirroredLetter}`
      }

      // Create blue team players
      const bluePlayers: Player[] = [
        // Goalkeeper
        ...formation.positions.G.map((pos, i) => 
          createPlayer('blue', 'G', pos, true)
        ),
        // Defenders
        ...formation.positions.D.map((pos, i) => 
          createPlayer('blue', 'D', pos)
        ),
        // Midfielders
        ...formation.positions.M.map((pos, i) => 
          createPlayer('blue', 'M', pos)
        ),
        // Forwards
        ...formation.positions.F.map((pos, i) => 
          createPlayer('blue', 'F', pos)
        )
      ]

      // Create red team players by mirroring the formation
      const redPlayers: Player[] = [
        // Goalkeeper
        ...formation.positions.G.map((pos, i) => 
          createPlayer('red', 'G', mirrorPosition(pos), true)
        ),
        // Defenders
        ...formation.positions.D.map((pos, i) => 
          createPlayer('red', 'D', mirrorPosition(pos))
        ),
        // Midfielders
        ...formation.positions.M.map((pos, i) => 
          createPlayer('red', 'M', mirrorPosition(pos))
        ),
        // Forwards
        ...formation.positions.F.map((pos, i) => 
          createPlayer('red', 'F', mirrorPosition(pos))
        )
      ]

      this.players = [...bluePlayers, ...redPlayers]
      
      // Find the blue team's forward player closest to the half line
      const blueForward = bluePlayers.find(p => p.role === 'F')
      if (blueForward) {
        // Place the ball in front of the forward across the half line
        this.ballPosition = {
          row: 8,  // Half line
          col: blueForward.position.col
        }
      } else {
        // Fallback position if no forward is found
        this.ballPosition = { row: 8, col: 4 }  // E9 position
      }
      
      this.currentTeam = 'blue'
      this.selectedPlayerId = null
      this.validMoves = []
      this.gamePhase = 'BALL_MOVEMENT'  // Start with ball movement phase
      this.score = { blue: 0, red: 0 }
      this.winner = null

      // Set up initial ball movement options
      const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition)
      const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam)
      
      if (currentTeamAdjacentPlayers.length > 0) {
        // Calculate possible ball moves based on current team's adjacent players
        const possibleBallMoves = new Set<Position>()
        currentTeamAdjacentPlayers.forEach(p => {
          getValidMoves(p, this.ballPosition, true).forEach(move => possibleBallMoves.add(move))
        })
        this.validMoves = Array.from(possibleBallMoves)
      }
    },

    selectPlayer(playerId: string) {
      const player = this.players.find(p => p.id === playerId)
      if (!player) return

      // Clear previous selection if clicking the same player
      if (this.selectedPlayerId === playerId) {
        this.selectedPlayerId = null
        this.validMoves = []
        return
      }

      this.selectedPlayerId = playerId
      // Get all possible moves
      let possibleMoves = getValidMoves(player, player.position)
      
      // Filter out moves that would land on other players
      possibleMoves = possibleMoves.filter(move => {
        // Check if any player is at this position
        const playerAtPosition = this.players.find(p => 
          p.position.row === move.row && p.position.col === move.col
        )
        
        // Check if ball is at this position
        const ballAtPosition = 
          this.ballPosition.row === move.row && 
          this.ballPosition.col === move.col

        return !playerAtPosition && !ballAtPosition
      })

      this.validMoves = possibleMoves
    },

    movePlayer(position: Position) {
      if (!this.selectedPlayer) return
      
      const player = this.selectedPlayer
      player.position = position
      
      // Reset selection after moving
      this.selectedPlayerId = null
      this.validMoves = []
    },

    moveBall(position: Position) {
      this.ballPosition = position
      
      // Check for goal - only when ball is in a goal cell
      const isInGoalCell = position.col >= 3 && position.col <= 6 && (position.row === -1 || position.row === 16)
      
      if (isInGoalCell) {
        if (position.row === -1) {
          this.score.red++
          alert(`GOAL! Red team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`)
          this.checkWinner()
          if (!this.winner) {
            this.resetPositions()
          }
        } else if (position.row === 16) {
          this.score.blue++
          alert(`GOAL! Blue team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`)
          this.checkWinner()
          if (!this.winner) {
            this.resetPositions()
          }
        }
      }
      
      this.endTurn()
    },

    endTurn() {
      this.selectedPlayerId = null
      this.validMoves = []
      this.gamePhase = 'PLAYER_SELECTION'
      this.currentTeam = this.currentTeam === 'blue' ? 'red' : 'blue'
    },

    checkWinner() {
      if (this.score.blue >= 3) {
        this.winner = 'blue'
        this.gamePhase = 'GAME_OVER'
      } else if (this.score.red >= 3) {
        this.winner = 'red'
        this.gamePhase = 'GAME_OVER'
      }
    },

    resetPositions() {
      // Reset all players to their initial positions
      this.players.forEach(player => {
        player.position = { ...player.initialPosition }
      })
      // Reset ball to center (F9 position)
      this.ballPosition = { row: 8, col: 5 }
    },

    getAdjacentPlayers(position: Position): Player[] {
      return this.players.filter(player => {
        const rowDiff = Math.abs(player.position.row - position.row)
        const colDiff = Math.abs(player.position.col - position.col)
        return (rowDiff <= 1 && colDiff <= 1) // Adjacent including diagonals
      })
    },

    getBallMoves(player: Player): Position[] {
      const moves: Position[] = []
      const { row, col } = this.ballPosition

      // Helper to add move if within bounds and not occupied
      const addMove = (r: number, c: number) => {
        // Allow goal cells (-1 and 16 for goals)
        const isGoal = (r === -1 || r === 16) && c >= 3 && c <= 6
        const isWithinField = r >= 0 && r < this.gridConfig.playingField.rows && 
                             c >= 0 && c < this.gridConfig.playingField.cols
        
        // Check if position is valid (either within field or a goal cell)
        if (isGoal || isWithinField) {
          // Check if position is occupied by a player
          const isOccupied = this.players.some(p => 
            p.position.row === r && p.position.col === c
          )
          
          if (!isOccupied) {
            moves.push({ row: r, col: c })
          }
        }
      }

      switch (player.role) {
        case 'G':
          // Goalkeeper: 3 cells in any straight direction
          for (let i = 1; i <= 3; i++) {
            addMove(row - i, col)    // Up
            addMove(row + i, col)    // Down
            addMove(row, col - i)    // Left
            addMove(row, col + i)    // Right
          }
          break

        case 'D':
          // Defender: 2 cells vertically or horizontally
          for (let i = 1; i <= 2; i++) {
            addMove(row - i, col)    // Up
            addMove(row + i, col)    // Down
            addMove(row, col - i)    // Left
            addMove(row, col + i)    // Right
          }
          break

        case 'M':
          // Midfielder: 2 cells diagonally
          for (let i = 1; i <= 2; i++) {
            addMove(row - i, col - i)  // Up-Left
            addMove(row - i, col + i)  // Up-Right
            addMove(row + i, col - i)  // Down-Left
            addMove(row + i, col + i)  // Down-Right
          }
          break

        case 'F':
          // Forward: 4 cells vertically or 2 cells horizontally
          for (let i = 1; i <= 4; i++) {
            if (i <= 2) {
              addMove(row, col - i)    // Left
              addMove(row, col + i)    // Right
            }
            addMove(row - i, col)    // Up
            addMove(row + i, col)    // Down
          }
          break
      }

      return moves
    },

    calculateValidMoves(player: Player): Position[] {
      const moves = getValidMoves(player, player.position);
      return moves.filter(move => {
        // Check if the move is within the grid bounds
        const { row, col } = move;
        const isWithinBounds = row >= 0 && row < this.gridConfig.playingField.rows &&
                             col >= 0 && col < this.gridConfig.playingField.cols;
        
        // Check if the move would land on the ball
        const isOnBall = row === this.ballPosition.row && col === this.ballPosition.col;
        
        // Check if the move would land on another player
        const isOnPlayer = this.players.some(p => 
          p.position.row === row && p.position.col === col
        );
        
        return isWithinBounds && !isOnBall && !isOnPlayer;
      });
    },

    selectCell(position: Position) {
      const cell = this.getCell(position);
      if (!cell) return;

      // If we have a selected player, first check if we can move the ball
      if (this.selectedPlayerId) {
        const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
        const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
        
        if (currentTeamAdjacentPlayers.length > 0) {
          // Calculate possible ball moves based on current team's adjacent players
          const possibleBallMoves = new Set<Position>();
          currentTeamAdjacentPlayers.forEach(p => {
            this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
          });
          
          // If clicking on the ball or a valid ball move position, switch to ball movement
          if (cell.hasBall || possibleBallMoves.has(position)) {
            this.validMoves = Array.from(possibleBallMoves);
            this.gamePhase = 'BALL_MOVEMENT';
            this.selectedPlayerId = null;
            return;
          }
        }
      }

      // Handle ball movement
      if (this.gamePhase === 'BALL_MOVEMENT') {
        if (this.validMoves.some(move => move.row === position.row && move.col === position.col)) {
          // Check if the ball would move onto a player
          const wouldMoveOntoPlayer = this.players.some(p => 
            p.position.row === position.row && p.position.col === position.col
          );
          
          if (!wouldMoveOntoPlayer) {
            this.ballPosition = position;
            this.validMoves = [];

            // Check for goal
            const isInGoalCell = position.col >= 3 && position.col <= 6 && (position.row === -1 || position.row === 16);
            
            if (isInGoalCell) {
              if (position.row === -1) {
                this.score.red++;
                alert(`GOAL! Red team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`);
                this.checkWinner();
                if (!this.winner) {
                  this.resetPositions();
                  this.currentTeam = 'blue'; // After red scores, blue gets the ball
                }
              } else if (position.row === 16) {
                this.score.blue++;
                alert(`GOAL! Blue team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`);
                this.checkWinner();
                if (!this.winner) {
                  this.resetPositions();
                  this.currentTeam = 'red'; // After blue scores, red gets the ball
                }
              }
            } else {
              this.gamePhase = 'PLAYER_SELECTION';
              this.currentTeam = this.currentTeam === 'blue' ? 'red' : 'blue';
            }
          }
        } else if (cell.hasBall) {
          // If clicking on the ball, calculate valid moves
          const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
          const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
          
          if (currentTeamAdjacentPlayers.length > 0) {
            const possibleBallMoves = new Set<Position>();
            currentTeamAdjacentPlayers.forEach(p => {
              this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
            });
            this.validMoves = Array.from(possibleBallMoves);
          }
        } else {
          // If clicking on an invalid ball move, stay in ball movement phase
          this.validMoves = [];
        }
        return;
      }

      // Handle player movement - only if not in first move
      if (this.gamePhase === 'PLAYER_SELECTION' && this.score.blue === 0 && this.score.red === 0) {
        // During first move, only allow ball movement
        const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
        const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
        
        if (currentTeamAdjacentPlayers.length > 0) {
          const possibleBallMoves = new Set<Position>();
          currentTeamAdjacentPlayers.forEach(p => {
            this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
          });
          this.validMoves = Array.from(possibleBallMoves);
          this.gamePhase = 'BALL_MOVEMENT';
        }
        return;
      }

      // Normal player movement logic after first move
      if (cell.player) {
        if (cell.player.team === this.currentTeam) {
          this.selectedPlayerId = cell.player.id;
          this.validMoves = this.calculateValidMoves(cell.player);
          this.gamePhase = 'PLAYER_MOVEMENT';
        }
      } else if (this.selectedPlayerId && this.validMoves.some(move => move.row === position.row && move.col === position.col)) {
        const player = this.players.find(p => p.id === this.selectedPlayerId);
        if (player) {
          player.position = position;
          this.selectedPlayerId = null;
          this.validMoves = [];
          this.gamePhase = 'PLAYER_SELECTION';
          this.currentTeam = this.currentTeam === 'blue' ? 'red' : 'blue';
        }
      } else if (this.gamePhase === 'PLAYER_SELECTION' && this.getAdjacentPlayers(this.ballPosition).some(p => p.team === this.currentTeam)) {
        // Handle ball movement after player movement
        const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
        const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
        
        if (currentTeamAdjacentPlayers.length > 0) {
          const possibleBallMoves = new Set<Position>();
          currentTeamAdjacentPlayers.forEach(p => {
            this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
          });
          this.validMoves = Array.from(possibleBallMoves);
          this.gamePhase = 'BALL_MOVEMENT';
        }
      }
    },
  },
}) 