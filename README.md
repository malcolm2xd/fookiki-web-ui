# Fookiki - A Football Inspired Game

## Overview
Fookiki is a unique football game inspired by chess, where players move on an NxN grid to control their team and attempt to score goals. The game combines strategic movement with the excitement of football, allowing players to engage in tactical gameplay.

## Project Structure
The project is organized as follows:

```
fookiki
├── public
│   └── index.html          # Main HTML file for the application
├── src
│   ├── assets              # Directory for static assets (images, fonts, styles)
│   ├── components          # Vue components for the game
│   │   ├── Grid.vue       # Component for the NxN grid
│   │   ├── Player.vue     # Component for player representation
│   │   └── Ball.vue       # Component for the ball representation
│   ├── views               # Views for the application
│   │   └── GameView.vue   # Main view for the game
│   ├── App.vue            # Root component of the Vue application
│   ├── main.js            # Entry point for the Vue application
│   └── store              # Vuex store for state management
│       └── index.js       # Store configuration
├── package.json            # npm configuration file
├── vite.config.js         # Vite configuration file
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd fookiki
   ```

2. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to see the game in action.

## Game Rules
- The game is played on an NxN grid.
- Each team consists of M players.
- Players can move from cell to cell on the grid.
- The objective is to move the ball into the opponent's goal.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.