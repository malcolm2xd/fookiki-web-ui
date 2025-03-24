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
      createPlayer('blue', 'G', '3A'),
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
      createPlayer('red', 'G', '14A'),
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
    isBallSelected: false as boolean,
    validMoves: [] as Position[],
    gamePhase: 'BALL_MOVEMENT' as 'PLAYER_SELECTION' | 'PLAYER_MOVEMENT' | 'BALL_MOVEMENT' | 'GAME_OVER',
    score: { blue: 0, red: 0 },
    winner: null as Team | null,
    currentFormation: 'malformation' as string,
    isFirstMove: true as boolean,
    blueScore: 0,
    redScore: 0,
    timerConfig: {
      duration: 10, // seconds per move
      warningThreshold: 3, // seconds before warning
      enabled: false, // whether timer is enabled
    },
    timerState: {
      timeLeft: 10,
      isRunning: false,
      timerId: null as number | null,
    },
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
    }
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
          createPlayer('blue', 'G', pos)
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
          createPlayer('red', 'G', mirrorPosition(pos))
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
      this.isFirstMove = true

      // Set up initial ball movement options
      const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition)
      const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam)
      
      if (currentTeamAdjacentPlayers.length > 0) {
        // Calculate possible ball moves based on current team's adjacent players
        const possibleBallMoves = new Set<Position>()
        currentTeamAdjacentPlayers.forEach(p => {
          this.getBallMoves(p).forEach(move => possibleBallMoves.add(move))
        })
        this.validMoves = Array.from(possibleBallMoves)
        this.isBallSelected = true
      }

      // Start the timer for the first player
      this.startTimer()
    },

    selectBall() {
      if (this.isFirstMove) {
        // For first move, only allow ball movement
        const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
        const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
        
        if (currentTeamAdjacentPlayers.length > 0) {
          const possibleBallMoves = new Set<Position>();
          currentTeamAdjacentPlayers.forEach(p => {
            this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
          });
          this.validMoves = Array.from(possibleBallMoves);
          this.isBallSelected = true;
          this.selectedPlayerId = null;
        }
        return;
      }

      // For subsequent moves, handle ball selection
      const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
      const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
      
      if (currentTeamAdjacentPlayers.length > 0) {
        const possibleBallMoves = new Set<Position>();
        currentTeamAdjacentPlayers.forEach(p => {
          this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
        });
        this.validMoves = Array.from(possibleBallMoves);
        this.isBallSelected = true;
        this.gamePhase = 'BALL_MOVEMENT';
        this.selectedPlayerId = null;
      }
    },

    endTurn() {
      this.stopTimer()
      this.currentTeam = this.currentTeam === 'blue' ? 'red' : 'blue'
      this.selectedPlayerId = null
      this.validMoves = []
      this.isBallSelected = false
      this.gamePhase = 'PLAYER_SELECTION'
      this.startTimer() // Start timer for next player
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

      // Place ball based on which team just scored
      if (this.currentTeam === 'blue') {
        // If blue team is current (meaning red just scored), place ball at 9E for blue to strike
        this.ballPosition = { row: 8, col: 4 }
      } else {
        // If red team is current (meaning blue just scored), place ball at 8F for red to strike
        this.ballPosition = { row: 7, col: 5 }
      }

      // Reset selection states
      this.selectedPlayerId = null
      this.validMoves = []
      this.isFirstMove = true

      // Set up initial ball movement options
      const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition)
      const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam)
      
      if (currentTeamAdjacentPlayers.length > 0) {
        // Calculate possible ball moves based on current team's adjacent players
        const possibleBallMoves = new Set<Position>()
        currentTeamAdjacentPlayers.forEach(p => {
          this.getBallMoves(p).forEach(move => possibleBallMoves.add(move))
        })
        this.validMoves = Array.from(possibleBallMoves)
        this.isBallSelected = true
      }
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
            addMove(row - i, col)    // Up
            addMove(row + i, col)    // Down
            if (i <= 2) {
              addMove(row, col - i)    // Left
              addMove(row, col + i)    // Right
            }
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
      if (!cell) {
        // If clicking outside the grid, clear all selections
        this.validMoves = [];
        this.isBallSelected = false;
        this.selectedPlayerId = null;
        this.gamePhase = 'PLAYER_SELECTION';
        return;
      }

      // If it's the first move, only allow ball movement
      if (this.isFirstMove) {
        if (cell.hasBall) {
          // If clicking on the ball, calculate valid moves
          const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
          const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
          
          if (currentTeamAdjacentPlayers.length > 0) {
            const possibleBallMoves = new Set<Position>();
            currentTeamAdjacentPlayers.forEach(p => {
              this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
            });
            this.validMoves = Array.from(possibleBallMoves);
            this.isBallSelected = true;
            this.selectedPlayerId = null;
          }
        } else if (this.validMoves.some(move => move.row === position.row && move.col === position.col)) {
          // Move the ball
          this.ballPosition = position;
          this.validMoves = [];
          this.isBallSelected = false;
          this.selectedPlayerId = null;
          this.isFirstMove = false;
          this.endTurn();
        } else {
          // If clicking outside valid moves, clear selection
          this.validMoves = [];
          this.isBallSelected = false;
          this.selectedPlayerId = null;
        }
        return;
      }

      // Handle ball movement
      if (this.gamePhase === 'BALL_MOVEMENT' || cell.hasBall) {
        if (cell.hasBall) {
          // If clicking on the ball, calculate valid moves
          const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
          const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);
          
          if (currentTeamAdjacentPlayers.length > 0) {
            const possibleBallMoves = new Set<Position>();
            currentTeamAdjacentPlayers.forEach(p => {
              this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
            });
            this.validMoves = Array.from(possibleBallMoves);
            this.isBallSelected = true;
            this.gamePhase = 'BALL_MOVEMENT';
            this.selectedPlayerId = null;
          }
        } else if (this.validMoves.some(move => move.row === position.row && move.col === position.col)) {
          // Check if the ball would move onto a player
          const wouldMoveOntoPlayer = this.players.some(p => 
            p.position.row === position.row && p.position.col === position.col
          );
          
          if (!wouldMoveOntoPlayer) {
            this.ballPosition = position;
            this.validMoves = [];
            this.isBallSelected = false;
            this.selectedPlayerId = null;

            // Check for goal
            const isInGoalCell = position.col >= 3 && position.col <= 6 && (position.row === -1 || position.row === 16);
            
            if (isInGoalCell) {
              if (position.row === -1) {
                this.score.red++;
                alert(`GOAL! Red team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`);
                this.checkWinner();
                if (!this.winner) {
                  this.currentTeam = 'blue'; // After red scores, blue gets the ball
                  this.resetPositions();
                }
              } else if (position.row === 16) {
                this.score.blue++;
                alert(`GOAL! Blue team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`);
                this.checkWinner();
                if (!this.winner) {
                  this.currentTeam = 'red'; // After blue scores, red gets the ball
                  this.resetPositions();
                }
              }
            } else {
              this.gamePhase = 'PLAYER_SELECTION';
            }
            this.endTurn(); // End turn after a move is made
          }
        } else {
          // If clicking outside valid moves, clear selection
          this.validMoves = [];
          this.isBallSelected = false;
          this.selectedPlayerId = null;
          this.gamePhase = 'PLAYER_SELECTION';
        }
        return;
      }

      // Handle player movement
      if (cell.player) {
        if (cell.player.team === this.currentTeam) {
          // Only allow player selection if we're not in ball movement phase or first move
          if (!this.isFirstMove && !this.isBallSelected) {
            this.selectedPlayerId = cell.player.id;
            this.validMoves = this.calculateValidMoves(cell.player);
            this.gamePhase = 'PLAYER_MOVEMENT';
            this.isBallSelected = false;
          }
        } else {
          // If clicking on opponent's player, clear selection
          this.selectedPlayerId = null;
          this.validMoves = [];
          this.gamePhase = 'PLAYER_SELECTION';
        }
      } else if (this.selectedPlayerId) {
        if (this.validMoves.some(move => move.row === position.row && move.col === position.col)) {
          // Valid move selected
          const player = this.players.find(p => p.id === this.selectedPlayerId);
          if (player) {
            player.position = position;
            this.selectedPlayerId = null;
            this.validMoves = [];
            this.gamePhase = 'PLAYER_SELECTION';
            this.endTurn(); // End turn after a move is made
          }
        } else {
          // Clicking outside valid moves, clear selection
          this.selectedPlayerId = null;
          this.validMoves = [];
          this.gamePhase = 'PLAYER_SELECTION';
        }
      }
    },

    startTimer() {
      if (!this.timerConfig.enabled) return
      
      this.timerState.timeLeft = this.timerConfig.duration
      this.timerState.isRunning = true
      this.timerState.timerId = window.setInterval(() => {
        if (this.timerState.timeLeft > 0) {
          this.timerState.timeLeft--
        } else {
          this.endTurn()
        }
      }, 1000)
    },

    stopTimer() {
      if (!this.timerConfig.enabled) return
      
      if (this.timerState.timerId) {
        clearInterval(this.timerState.timerId)
        this.timerState.timerId = null
      }
      this.timerState.isRunning = false
    },

    resetTimer() {
      if (!this.timerConfig.enabled) return
      
      this.stopTimer()
      this.timerState.timeLeft = this.timerConfig.duration
    },

    toggleTimer() {
      this.timerConfig.enabled = !this.timerConfig.enabled
      if (this.timerConfig.enabled) {
        this.startTimer()
      } else {
        this.stopTimer()
      }
    },
  },
}) 