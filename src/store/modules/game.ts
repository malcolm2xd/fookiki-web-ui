import { Module } from 'vuex';
import { RootState, GameState, Position, PlayerType, Team } from '@/types';
import { 
  initializeBoard, 
  calculateValidPlayerMoves, 
  calculateValidBallMoves,
  positionsEqual,
  initializePlayers,
  isGoalScored,
  determineInitialBallPosition,
  resetPlayersToInitialPositions
} from '@/utils/gameLogic';
import { getAiMove } from '@/utils/aiPlayer';

const gameModule: Module<GameState, RootState> = {
  namespaced: true,
  
  state: () => ({
    gameStarted: false,
    gamePhase: 'PLAYER_SELECTION', // PLAYER_SELECTION, PLAYER_MOVEMENT, BALL_MOVEMENT, GAME_OVER
    gridWidth: 16,
    gridHeight: 10,
    playersPerTeam: 5,
    winningScore: 3,
    gameMode: 'local', // local, ai
    aiDifficulty: 'medium',
    currentTeam: 'blue',
    currentTurn: 1,
    board: [],
    players: {
      blue: [],
      red: []
    },
    ballPosition: { row: 0, col: 0 },
    selectedPlayerId: null,
    validMoves: [],
    score: {
      blue: 0,
      red: 0
    },
    stats: {
      moves: {
        blue: 0,
        red: 0
      },
      passes: {
        blue: 0,
        red: 0
      }
    },
    goalScored: false,
    winner: null,
    showCoordinates: false,
    showValidMoves: true,
    turnHistory: []
  }),
  
  getters: {
    gridSize: (state) => Math.max(state.gridWidth, state.gridHeight)
  },
  
  mutations: {
    setupGame(state, { gridWidth, gridHeight, playersPerTeam, winningScore, gameMode, aiDifficulty }) {
      state.gridWidth = gridWidth || 16;
      state.gridHeight = gridHeight || 10;
      state.playersPerTeam = playersPerTeam;
      state.winningScore = winningScore;
      state.gameMode = gameMode;
      state.aiDifficulty = aiDifficulty;
      
      // Initialize the board
      state.board = initializeBoard(state.gridWidth, state.gridHeight);
      
      // Initialize players
      const { bluePlayers, redPlayers } = initializePlayers(state.gridWidth, state.gridHeight, playersPerTeam);
      state.players = {
        blue: bluePlayers,
        red: redPlayers
      };
      
      // Place the ball in the center of the field
      state.ballPosition = determineInitialBallPosition(state.gridWidth, state.gridHeight);
    },
    
    startGame(state) {
      state.gameStarted = true;
      state.gamePhase = 'PLAYER_SELECTION';
      state.currentTeam = 'blue';
      state.currentTurn = 1;
      state.score = { blue: 0, red: 0 };
      state.stats = {
        moves: { blue: 0, red: 0 },
        passes: { blue: 0, red: 0 }
      };
      state.selectedPlayerId = null;
      state.validMoves = [];
      state.winner = null;
      state.goalScored = false;
      state.turnHistory = [];
    },
    
    resetGame(state) {
      state.gameStarted = false;
      state.gamePhase = 'PLAYER_SELECTION';
      state.currentTeam = 'blue';
      state.currentTurn = 1;
      state.score = { blue: 0, red: 0 };
      state.stats = {
        moves: { blue: 0, red: 0 },
        passes: { blue: 0, red: 0 }
      };
      state.selectedPlayerId = null;
      state.validMoves = [];
      state.winner = null;
      state.goalScored = false;
      state.turnHistory = [];
    },
    
    selectPlayer(state, playerId) {
      state.selectedPlayerId = playerId;
      state.gamePhase = 'PLAYER_MOVEMENT';
      
      // Find the selected player
      const player = [...state.players.blue, ...state.players.red].find(p => p.id === playerId);
      
      if (player) {
        // Calculate valid moves for the player
        state.validMoves = calculateValidPlayerMoves(player, state.players, state.ballPosition, state.gridWidth);
      }
    },
    
    movePlayer(state, { row, col }) {
      if (!state.selectedPlayerId) return;
      
      // Find the selected player
      let player: PlayerType | undefined;
      let playerIndex = -1;
      
      for (let i = 0; i < state.players[state.currentTeam].length; i++) {
        if (state.players[state.currentTeam][i].id === state.selectedPlayerId) {
          player = state.players[state.currentTeam][i];
          playerIndex = i;
          break;
        }
      }
      
      if (!player || playerIndex === -1) return;
      
      // Save previous position for history
      const prevPosition = { ...player.position };
      
      // Update player position
      player.position = { row, col };
      state.players[state.currentTeam][playerIndex] = player;
      
      // Update stats
      state.stats.moves[state.currentTeam]++;
      
      // Check if the player has the ball
      const hasBall = positionsEqual(player.position, state.ballPosition);
      
      if (hasBall) {
        // Move the ball with the player
        state.ballPosition = { row, col };
        state.gamePhase = 'BALL_MOVEMENT';
        
        // Calculate valid ball moves
        state.validMoves = calculateValidBallMoves(player, state.players, state.gridWidth);
      } else {
        // Switch to the next player after a move
        state.gamePhase = 'PLAYER_SELECTION';
        state.selectedPlayerId = null;
        state.validMoves = [];
        
        // Save turn history
        state.turnHistory.push({
          turn: state.currentTurn,
          action: 'move',
          team: state.currentTeam,
          playerId: player.id,
          from: prevPosition,
          to: { row, col }
        });
        
        // Switch teams
        state.currentTeam = state.currentTeam === 'blue' ? 'red' : 'blue';
        state.currentTurn++;
      }
    },
    
    moveBall(state, { row, col }) {
      // Save previous position for history
      const prevPosition = { ...state.ballPosition };
      
      // Move the ball
      state.ballPosition = { row, col };
      
      // Update stats for passes
      state.stats.passes[state.currentTeam]++;
      
      // Check if a goal was scored
      const goalInfo = isGoalScored(state.ballPosition, state.gridWidth);
      
      if (goalInfo.scored) {
        state.goalScored = true;
        
        // Update score
        if (goalInfo.team === 'blue') {
          state.score.blue++;
        } else {
          state.score.red++;
        }
        
        // Check if the game is over
        if (state.score.blue >= state.winningScore) {
          state.gamePhase = 'GAME_OVER';
          state.winner = 'blue';
        } else if (state.score.red >= state.winningScore) {
          state.gamePhase = 'GAME_OVER';
          state.winner = 'red';
        } else {
          // Reset player positions after a goal
          resetPlayersToInitialPositions(state.players, state.gridWidth, state.gridHeight);
          state.ballPosition = determineInitialBallPosition(state.gridWidth, state.gridHeight);
          state.gamePhase = 'PLAYER_SELECTION';
          state.selectedPlayerId = null;
          state.validMoves = [];
          
          // Start with the team that conceded the goal
          state.currentTeam = goalInfo.team === 'blue' ? 'red' : 'blue';
        }
      } else {
        // No goal, continue normal play
        state.goalScored = false;
        state.gamePhase = 'PLAYER_SELECTION';
        state.selectedPlayerId = null;
        state.validMoves = [];
        
        // Switch teams
        state.currentTeam = state.currentTeam === 'blue' ? 'red' : 'blue';
        state.currentTurn++;
      }
      
      // Save turn history
      state.turnHistory.push({
        turn: state.currentTurn,
        action: 'ballMove',
        team: state.currentTeam === 'blue' ? 'red' : 'blue',
        from: prevPosition,
        to: { row, col },
        goalScored: state.goalScored
      });
      
      // Check if it's AI's turn
      if (state.gameMode === 'ai' && state.currentTeam === 'red' && state.gamePhase !== 'GAME_OVER') {
        // AI logic will be handled by the action
      }
    },
    
    resetTurn(state) {
      // Get the last turn history item
      const lastTurn = state.turnHistory[state.turnHistory.length - 1];
      
      if (!lastTurn) return;
      
      // Undo the last action
      if (lastTurn.action === 'move') {
        // Find the player
        const team = lastTurn.team as Team;
        const player = state.players[team].find(p => p.id === lastTurn.playerId);
        
        if (player) {
          // Move player back to previous position
          player.position = { ...lastTurn.from };
          
          // Update stats
          state.stats.moves[team]--;
        }
      } else if (lastTurn.action === 'ballMove') {
        // Move ball back to previous position
        state.ballPosition = { ...lastTurn.from };
        
        // Update stats and score if a goal was scored
        const team = lastTurn.team as Team;
        state.stats.passes[team]--;
        
        if (lastTurn.goalScored) {
          if (team === 'blue') {
            state.score.blue--;
          } else {
            state.score.red--;
          }
        }
      }
      
      // Remove the last turn from history
      state.turnHistory.pop();
      
      // Reset game state
      state.gamePhase = 'PLAYER_SELECTION';
      state.selectedPlayerId = null;
      state.validMoves = [];
      state.currentTeam = lastTurn.team as Team;
      state.currentTurn--;
      state.goalScored = false;
    },
    
    endTurn(state) {
      state.gamePhase = 'PLAYER_SELECTION';
      state.selectedPlayerId = null;
      state.validMoves = [];
      
      // Switch teams
      state.currentTeam = state.currentTeam === 'blue' ? 'red' : 'blue';
      state.currentTurn++;
      
      // Check if it's AI's turn
      if (state.gameMode === 'ai' && state.currentTeam === 'red') {
        // AI logic will be handled by the action
      }
    },
    
    setShowCoordinates(state, value) {
      state.showCoordinates = value;
    },
    
    setShowValidMoves(state, value) {
      state.showValidMoves = value;
    }
  },
  
  actions: {
    setupGame({ commit }, gameSettings) {
      commit('setupGame', gameSettings);
    },
    
    startGame({ commit }) {
      commit('startGame');
    },
    
    resetGame({ commit }) {
      commit('resetGame');
    },
    
    selectPlayer({ commit }, playerId) {
      commit('selectPlayer', playerId);
    },
    
    movePlayer({ commit, state, dispatch }, position) {
      commit('movePlayer', position);
      
      // If it's AI's turn after player movement, trigger AI move
      if (state.gameMode === 'ai' && state.currentTeam === 'red' && state.gamePhase === 'PLAYER_SELECTION') {
        dispatch('performAiTurn');
      }
    },
    
    moveBall({ commit, state, dispatch }, position) {
      commit('moveBall', position);
      
      // If it's AI's turn after ball movement, trigger AI move
      if (state.gameMode === 'ai' && state.currentTeam === 'red' && state.gamePhase === 'PLAYER_SELECTION') {
        dispatch('performAiTurn');
      }
    },
    
    resetTurn({ commit }) {
      commit('resetTurn');
    },
    
    endTurn({ commit, state, dispatch }) {
      commit('endTurn');
      
      // If it's AI's turn after ending turn, trigger AI move
      if (state.gameMode === 'ai' && state.currentTeam === 'red') {
        dispatch('performAiTurn');
      }
    },
    
    performAiTurn({ state, dispatch }) {
      // Small delay to make AI move feel more natural
      setTimeout(() => {
        const aiMove = getAiMove(
          state.players,
          state.ballPosition,
          state.gridSize,
          state.aiDifficulty
        );
        
        if (aiMove.type === 'player') {
          // Select AI player
          dispatch('selectPlayer', aiMove.playerId);
          
          // Small delay between selection and movement
          setTimeout(() => {
            // Move AI player
            dispatch('movePlayer', aiMove.position);
          }, 500);
        } else if (aiMove.type === 'ball') {
          // AI has the ball, move it
          dispatch('moveBall', aiMove.position);
        }
      }, 750);
    }
  }
};

export default gameModule;
