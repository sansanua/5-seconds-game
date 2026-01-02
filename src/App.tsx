import { useState } from 'react'
import type { Screen, Player, Cell, PlayerStats } from './types'
import './App.css'
import StartScreen from './screens/StartScreen'
import SetupScreen from './screens/SetupScreen'
import GameScreen from './screens/GameScreen'
import VictoryScreen from './screens/VictoryScreen'

interface GameData {
  players: Player[]
  boardLength: number
  winner: Player | null
  board: Cell[]
  playerStats: Record<string, PlayerStats>
}

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [gameData, setGameData] = useState<GameData>({
    players: [],
    boardLength: 15,
    winner: null,
    board: [],
    playerStats: {}
  })

  const navigate = (newScreen: Screen) => setScreen(newScreen)

  const handleStartGame = (players: Player[], boardLength: number) => {
    setGameData({ players, boardLength, winner: null, board: [], playerStats: {} })
  }

  const handleGameEnd = (winner: Player, board: Cell[], playerStats: Record<string, PlayerStats>) => {
    setGameData(prev => ({ ...prev, winner, board, playerStats }))
  }

  const handlePlayAgain = () => {
    // Reset player positions and start new game with same players
    const resetPlayers = gameData.players.map(p => ({ ...p, position: 0 }))
    setGameData(prev => ({ ...prev, players: resetPlayers, winner: null, board: [], playerStats: {} }))
    setScreen('game')
  }

  const handleNewGame = () => {
    // Go back to setup with cleared players
    setGameData({ players: [], boardLength: gameData.boardLength, winner: null, board: [], playerStats: {} })
    setScreen('setup')
  }

  switch (screen) {
    case 'start':
      return <StartScreen onNavigate={navigate} />
    case 'setup':
      return <SetupScreen onNavigate={navigate} onStartGame={handleStartGame} />
    case 'game':
      return (
        <GameScreen
          players={gameData.players}
          boardLength={gameData.boardLength}
          onNavigate={navigate}
          onGameEnd={handleGameEnd}
        />
      )
    case 'victory':
      return (
        <VictoryScreen
          winner={gameData.winner}
          players={gameData.players}
          board={gameData.board}
          playerStats={gameData.playerStats}
          onNavigate={navigate}
          onPlayAgain={handlePlayAgain}
          onNewGame={handleNewGame}
        />
      )
  }
}

export default App
