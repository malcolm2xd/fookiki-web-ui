import { defineStore } from 'pinia'
import type { GridConfig } from '@/types/grid'
import type { Formation } from '@/types/formations'
import { DEFAULT_GRID_CONFIG, getTotalDimensions } from '@/types/grid'
import { FORMATION } from '@/types/formations'
import { getValidMoves } from '@/types/player'
import { Player, Position, Team, PlayerRole } from '@/types/player'

// Convert from letter-number format (e.g., '3A') to Position
function parsePosition(coord: string): Position {
  const letter = coord.slice(-1)  // Get last character (the letter)
  const number = coord.slice(0, -1)  // Get all characters except the last one (the number)
  const col = letter.charCodeAt(0) - 65  // Convert A-J to 0-9
  const row = parseInt(number) - 1  // Convert 1-16 to 0-15
  return { row, col }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    gameConfig: {
      opponent: 'local' as 'local' | 'ai' | 'online',
      mode: 'timed', // 'timed', 'race', 'gap', 'infinite'
      duration: 300, // 5 minutes default
      goalTarget: 5, // for race mode
      goalGap: 2 // for gap mode
    },
    gridConfig: DEFAULT_GRID_CONFIG,
    currentTeam: 'blue' as Team,
    players: [] as Player[],
    ballPosition: { row: 8, col: 5 } as Position, // F9 position
    selectedPlayerId: null as string | null,
    isBallSelected: false as boolean,
    validMoves: [] as Position[],
    gamePhase: 'BALL_MOVEMENT' as 'PLAYER_SELECTION' | 'PLAYER_MOVEMENT' | 'BALL_MOVEMENT' | 'GAME_OVER',
    score: { blue: 0, red: 0 },
    winner: null as Team | null,
    isFirstMove: true as boolean,
    blueScore: 0,
    redScore: 0,
    celebration: {
      show: false,
      team: null as Team | null,
      message: '',
    },
    timerConfig: {
      duration: 10, // seconds per move
      warningThreshold: 3, // seconds
      enabled: false,
      gameDuration: 300, // 5 minutes in seconds
      extraTimeDuration: 300, // 5 minutes in seconds
      extraTimeTurnDuration: 10, // 10 seconds per move in extra time
      remainingTime: 10,
      progress: 100,
      isRunning: false,
      timerId: undefined as number | undefined,
    },
    timerState: {
      timeLeft: 10,
      isRunning: false,
      timerId: null as number | null,
    },
    gameTimerState: {
      timeLeft: 0, // Will be set to timerConfig.gameDuration when game starts
      isRunning: false,
      timerId: null as number | null,
      isExtraTime: false, // Track if we're in extra time
    },
    canCaptainMoveAgain: false, // Track if captain can move again
  }),

  getters: {
    totalDimensions: (state) => getTotalDimensions(state.gridConfig),
    allPlayers: (state) => state.players,
    bluePlayers: (state) => state.players.filter((p: Player) => p.team === 'blue'),
    redPlayers: (state) => state.players.filter((p: Player) => p.team === 'red'),
    selectedPlayer: (state) => state.players.find((p: Player) => p.id === state.selectedPlayerId),
    getCell: (state) => (position: Position) => {
      const player = state.players.find((p: Player) => p.position.row === position.row && p.position.col === position.col);
      return {
        position,
        player,
        hasBall: state.ballPosition.row === position.row && state.ballPosition.col === position.col
      };
    }
  },

  actions: {
    initializeGame() {
      // Clean up any existing timers first
      this.stopGameTimer()
      this.stopTurnTimer()
      this.currentTeam = 'blue'

      // Reset timer states
      this.timerState = {
        timeLeft: this.timerConfig.duration,
        isRunning: false,
        timerId: null
      }

      this.gameTimerState = {
        timeLeft: this.timerConfig.gameDuration,
        isRunning: false,
        timerId: null,
        isExtraTime: false
      }

      FORMATION.positions.forEach(pos => {
        this.players.push({
          id: `${pos.team}-${pos.role}-${pos.position}`,
          team: pos.team,
          role: pos.role,
          position: parsePosition(pos.position),
          initialPosition: { ...parsePosition(pos.position) },
          isCaptain: pos.isCaptain
        })
      })

      this.ballPosition = parsePosition(FORMATION.ball.find(p => p.team === this.currentTeam)?.position ?? '')

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

      // Initialize game timer from config
      this.gameTimerState.timeLeft = this.timerConfig.gameDuration
      this.startGameTimer()
      if (this.timerConfig.enabled) {
        this.startTurnTimer()
      }
    },

    selectBall() {
      if (this.isFirstMove) {
        // For first move, only allow ball movement
        const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
        const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);

        if (currentTeamAdjacentPlayers.length > 0) {
          const possibleBallMoves = new Set<Position>();
          currentTeamAdjacentPlayers.forEach(p => {
            // Use getBallMoves which already includes the opponent blocking rules
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
      this.stopTurnTimer()
      // Always switch teams after a move, regardless of captain's special ability
      this.currentTeam = this.currentTeam === 'blue' ? 'red' : 'blue'
      this.selectedPlayerId = null
      this.validMoves = []
      this.isBallSelected = false
      this.gamePhase = 'PLAYER_SELECTION'
      this.canCaptainMoveAgain = false
      this.startTurnTimer() // Start timer for next player
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
      this.players.forEach((player: Player) => {
        player.position = { ...player.initialPosition }
      })

      this.ballPosition = parsePosition(FORMATION.ball.find(p => p.team === this.currentTeam)?.position ?? '')
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
      return this.players.filter((player: Player) => {
        const rowDiff = Math.abs(player.position.row - position.row)
        const colDiff = Math.abs(player.position.col - position.col)
        return (rowDiff <= 1 && colDiff <= 1) // Adjacent including diagonals
      })
    },

    getBallMoves(player: Player): Position[] {
      const moves: Position[] = []
      const { row, col } = this.ballPosition

      // Helper to check if a position is occupied by an opponent
      const hasOpponent = (r: number, c: number): Player | null => {
        return this.players.find((p: Player) =>
          p.team !== player.team &&
          p.position.row === r &&
          p.position.col === c
        ) || null
      }

      // Helper to check if a path is blocked by an opponent
      const isPathBlocked = (startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
        const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0
        const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0
        let currentRow = startRow
        let currentCol = startCol

        while (currentRow !== endRow || currentCol !== endCol) {
          currentRow += rowStep
          currentCol += colStep
          const opponent = hasOpponent(currentRow, currentCol)
          if (opponent) {
            const canMovePast = this.canMovePastOpponent(player.role, opponent.role)
            if (!canMovePast) {
              return true
            }
          }
        }
        return false
      }

      // Helper to add move if within bounds and not blocked
      const addMove = (r: number, c: number) => {
        // Allow goal cells (-1 and 16 for goals)
        const isGoal = (r === -1 || r === 16) && c >= 3 && c <= 6
        const isWithinField = r >= 0 && r < this.gridConfig.playingField.rows &&
          c >= 0 && c < this.gridConfig.playingField.cols

        // Check if position is valid (either within field or a goal cell)
        if (isGoal || isWithinField) {
          // Check if position is occupied by any player
          const playerAtPosition = this.players.find((p: Player) =>
            p.position.row === r &&
            p.position.col === c
          )

          if (!playerAtPosition) {
            // Check if path is blocked by opponents
            if (!isPathBlocked(row, col, r, c)) {
              moves.push({ row: r, col: c })
            }
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

    // Helper to find space beyond an opponent
    getSpaceBeyondOpponent(opponentRow: number, opponentCol: number, ballRow: number, ballCol: number): Position | null {
      // Calculate direction from ball to opponent
      const rowDiff = opponentRow - ballRow
      const colDiff = opponentCol - ballCol

      // Calculate position beyond opponent
      const beyondRow = opponentRow + (rowDiff > 0 ? 1 : rowDiff < 0 ? -1 : 0)
      const beyondCol = opponentCol + (colDiff > 0 ? 1 : colDiff < 0 ? -1 : 0)

      // Check if the beyond position is valid and not occupied
      const isWithinField = beyondRow >= 0 && beyondRow < this.gridConfig.playingField.rows &&
        beyondCol >= 0 && beyondCol < this.gridConfig.playingField.cols

      if (isWithinField) {
        const isOccupied = this.players.some((p: Player) =>
          p.position.row === beyondRow && p.position.col === beyondCol
        )

        if (!isOccupied) {
          return { row: beyondRow, col: beyondCol }
        }
      }

      return null
    },

    canMovePastOpponent(attackerRole: string, opponentRole: string): boolean {
      // Define the movement rules based on the matrix
      const movementRules: Record<string, Record<string, boolean>> = {
        'G': { 'G': false, 'D': false, 'M': false, 'F': false },
        'D': { 'G': false, 'D': true, 'M': true, 'F': false },
        'M': { 'G': true, 'D': true, 'M': true, 'F': true },
        'F': { 'G': false, 'D': false, 'M': true, 'F': false }
      }

      return movementRules[attackerRole]?.[opponentRole] ?? false
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
        const isOnPlayer = this.players.some((p: Player) =>
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
        } else if (this.validMoves.some((move: Position) => move.row === position.row && move.col === position.col)) {
          // Move the ball
          this.ballPosition = position;
          this.validMoves = [];
          this.isBallSelected = false;
          this.selectedPlayerId = null;
          this.isFirstMove = false;
          this.endTurn();
        }
        return;
      }

      // Handle ball movement for subsequent moves
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
        } else if (this.validMoves.some((move: Position) => move.row === position.row && move.col === position.col)) {
          // Check if there's an opponent player at the target position
          const opponentPlayer = this.players.find((p: Player) =>
            p.team !== this.currentTeam &&
            p.position.row === position.row &&
            p.position.col === position.col
          );

          if (opponentPlayer) {
            // Find the player who's moving the ball
            const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
            const currentTeamAdjacentPlayer = adjacentPlayers.find(p => p.team === this.currentTeam);

            if (currentTeamAdjacentPlayer) {
              const canMovePast = this.canMovePastOpponent(currentTeamAdjacentPlayer.role, opponentPlayer.role);
              if (!canMovePast) {
                // If cannot move past, clear selection and return
                this.validMoves = [];
                this.isBallSelected = false;
                this.selectedPlayerId = null;
                return;
              }
            }
          }

          // Check if the ball would move onto a player
          const wouldMoveOntoPlayer = this.players.some((p: Player) =>
            p.position.row === position.row && p.position.col === position.col
          );

          if (!wouldMoveOntoPlayer) {
            const oldBallPosition = { ...this.ballPosition };
            this.ballPosition = position;
            this.validMoves = [];
            this.isBallSelected = false;
            this.selectedPlayerId = null;

            // Check for goal
            const isInGoalCell = position.col >= 3 && position.col <= 6 && (position.row === -1 || position.row === 16);

            if (isInGoalCell) {
              if (position.row === -1) {
                this.score.red++;
                this.redScore++;
                // Update ball position to show in goal
                this.ballPosition = position;
                // Stop timers before celebration
                this.stopGameTimer();
                this.stopTurnTimer();
                this.showCelebration('red', `GOAL! Red team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`);
                this.currentTeam = 'blue'; // After red scores, blue gets the ball
                this.resetPositions();
                this.resetTurnTimer() // Reset turn timer for the new team
              } else if (position.row === 16) {
                this.score.blue++;
                this.blueScore++;
                // Update ball position to show in goal
                this.ballPosition = position;
                // Stop timers before celebration
                this.stopGameTimer();
                this.stopTurnTimer();
                this.showCelebration('blue', `GOAL! Blue team scores! Score: Blue ${this.score.blue} - ${this.score.red} Red`);
                this.currentTeam = 'red'; // After blue scores, red gets the ball
                this.resetPositions();
                this.resetTurnTimer() // Reset turn timer for the new team
              }
            } else {
              // Check for captain's special ability
              const adjacentPlayers = this.getAdjacentPlayers(this.ballPosition);
              const currentTeamAdjacentPlayers = adjacentPlayers.filter(p => p.team === this.currentTeam);

              // Check if ball was passed from a captain and captain hasn't used their special ability yet
              const wasPassedFromCaptain = this.getAdjacentPlayers(oldBallPosition).some(p =>
                p.team === this.currentTeam && p.isCaptain
              );

              // Check if the receiving player is a captain
              const receivingPlayerIsCaptain = currentTeamAdjacentPlayers.some(p => p.isCaptain);

              if (wasPassedFromCaptain && !this.canCaptainMoveAgain && !receivingPlayerIsCaptain) {
                // Player receiving the ball from captain can move it again
                this.gamePhase = 'BALL_MOVEMENT';
                // Calculate new valid moves for ball movement only
                const possibleBallMoves = new Set<Position>();
                currentTeamAdjacentPlayers.forEach(p => {
                  this.getBallMoves(p).forEach(move => possibleBallMoves.add(move));
                });
                this.validMoves = Array.from(possibleBallMoves);
                this.isBallSelected = true;
                this.canCaptainMoveAgain = true; // Mark that captain has used their special ability

                // Reset turn timer for the receiving player
                this.resetTurnTimer();
                this.startTurnTimer();
                return;
              }

              this.gamePhase = 'PLAYER_SELECTION';
              this.endTurn(); // Only end turn if not a goal and no captain move
            }
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
        if (this.validMoves.some((move: Position) => move.row === position.row && move.col === position.col)) {
          // Valid move selected
          const player = this.players.find((p: Player) => p.id === this.selectedPlayerId);
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

    startTurnTimer() {
      if (!this.timerConfig.enabled) return
      if (this.timerState.timerId) {
        clearInterval(this.timerState.timerId);
      }
      this.timerState.timeLeft = this.timerConfig.duration
      this.timerState.isRunning = true
      this.timerState.timerId = window.setInterval(() => {
        if (this.timerState.timeLeft > 0) {
          this.timerState.timeLeft--
        } else {
          this.endTurn()
        }
      }, 1000)
      console.log('Starting timer with ID:', this.timerState.timerId)
    },

    stopTurnTimer() {
      if (this.timerState.timerId) {
        clearInterval(this.timerState.timerId)
        this.timerState.timerId = null
      }
      this.timerState.isRunning = false
    },

    resetTurnTimer() {
      if (!this.timerConfig.enabled) return;

      this.stopTurnTimer();
      this.timerConfig.remainingTime = this.timerConfig.duration;
      this.timerConfig.progress = 100;
      this.timerConfig.isRunning = false;
      if (this.timerConfig.timerId) {
        clearInterval(this.timerConfig.timerId);
        this.timerConfig.timerId = undefined;
      }
    },

    toggleTurnTimer() {
      this.timerConfig.enabled = !this.timerConfig.enabled
      if (this.timerConfig.enabled) {
        this.startTurnTimer()
      } else {
        this.stopTurnTimer()
      }
    },

    startGameTimer() {
      if (this.gameTimerState.timerId) return;
      this.gameTimerState.isRunning = true;
      this.gameTimerState.timerId = window.setInterval(() => {
        if (this.gameTimerState.timeLeft > 0) {
          this.gameTimerState.timeLeft--;
        } else {
          this.endGame();
        }
      }, 1000);
    },

    stopGameTimer() {
      if (this.gameTimerState.timerId) {
        clearInterval(this.gameTimerState.timerId)
        this.gameTimerState.timerId = null
      }
      this.gameTimerState.isRunning = false
    },

    endGame() {
      // Clean up timers first
      this.stopGameTimer()
      this.stopTurnTimer()

      // Check if scores are tied and we're not already in extra time
      if (this.score.blue === this.score.red && !this.gameTimerState.isExtraTime) {
        // Reset timer states before starting extra time
        this.timerState = {
          timeLeft: this.timerConfig.extraTimeTurnDuration,
          isRunning: false,
          timerId: null
        }

        this.gameTimerState = {
          timeLeft: this.timerConfig.extraTimeDuration,
          isRunning: false,
          timerId: null,
          isExtraTime: true
        }

        // Start extra time
        this.timerConfig.duration = this.timerConfig.extraTimeTurnDuration
        this.startGameTimer()
        if (this.timerConfig.enabled) {
          this.startTurnTimer()
        }
        // alert('Scores are tied! Starting extra time (2 minutes) with 4-second turns!')
        return
      }

      // Determine winner based on score
      if (this.score.blue > this.score.red) {
        this.winner = 'blue'
      } else if (this.score.red > this.score.blue) {
        this.winner = 'red'
      } else {
        // If scores are tied after extra time, it's a draw
        this.winner = null
      }

      this.gamePhase = 'GAME_OVER'
      // alert(`Game Over! ${this.winner === 'blue' ? 'Blue' : this.winner === 'red' ? 'Red' : 'It\'s a'} ${this.winner ? 'team wins!' : 'draw!'}`)

      // Reset the game after a short delay
      setTimeout(() => {
        this.initializeGame()
      }, 2000)
    },

    showCelebration(team: Team, message: string) {
      // Stop both timers before showing the modal
      this.stopGameTimer();
      this.stopTurnTimer();
      this.celebration = {
        show: true,
        team,
        message,
      };
    },

    hideCelebration() {
      this.celebration.show = false;
      this.celebration.team = null;
      this.celebration.message = '';

      // Restart timers after celebration
      this.startGameTimer();
      if (this.timerConfig.enabled) {
        this.startTurnTimer(); // Start turn timer for the next player
      }
    },

    checkGoal() {
      const { row, col } = this.ballPosition;
      if (row === -1) {
        // Blue team scored
        this.blueScore++;
        this.ballPosition = { row: 15, col: 5 }; // Show ball in goal
        this.showCelebration('blue', 'GOAL! Blue team scores!');
        this.resetPositions();
        this.currentTeam = 'red';
        return true;
      } else if (row === 16) {
        // Red team scored
        this.redScore++;
        this.ballPosition = { row: 0, col: 5 }; // Show ball in goal
        this.showCelebration('red', 'GOAL! Red team scores!');
        this.resetPositions();
        this.currentTeam = 'blue';
        return true;
      }
      return false;
    },
  },
})

export type {
  GameMode,
  GameState
} from '@/types/game'

export { parsePosition }