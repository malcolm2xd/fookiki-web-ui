import { createStore } from 'vuex';

const store = createStore({
  state: {
    gridSize: 5, // Example grid size NxN
    players: {
      teamA: [],
      teamB: []
    },
    ballPosition: { x: 0, y: 0 }
  },
  mutations: {
    setPlayers(state, { team, players }) {
      state.players[team] = players;
    },
    movePlayer(state, { team, playerIndex, newPosition }) {
      state.players[team][playerIndex].position = newPosition;
    },
    moveBall(state, newPosition) {
      state.ballPosition = newPosition;
    }
  },
  actions: {
    initializePlayers({ commit }, { team, playerCount }) {
      const players = Array.from({ length: playerCount }, (_, index) => ({
        id: `${team}-${index}`,
        position: { x: 0, y: index } // Initial positions
      }));
      commit('setPlayers', { team, players });
    },
    updatePlayerPosition({ commit }, { team, playerIndex, newPosition }) {
      commit('movePlayer', { team, playerIndex, newPosition });
    },
    updateBallPosition({ commit }, newPosition) {
      commit('moveBall', newPosition);
    }
  },
  getters: {
    getPlayers: (state) => (team) => {
      return state.players[team];
    },
    getBallPosition: (state) => {
      return state.ballPosition;
    }
  }
});

export default store;