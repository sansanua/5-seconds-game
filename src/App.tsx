import { useState } from 'react'
import { Screen, Player } from './types'
import './App.css'
import StartScreen from './screens/StartScreen'
import SetupScreen from './screens/SetupScreen'
import GameScreen from './screens/GameScreen'

interface GameData {
  players: Player[]
  boardLength: number
  winner: Player | null
}

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [gameData, setGameData] = useState<GameData>({
    players: [],
    boardLength: 15,
    winner: null
  })

  const navigate = (newScreen: Screen) => setScreen(newScreen)

  const handleStartGame = (players: Player[], boardLength: number) => {
    setGameData({ players, boardLength, winner: null })
  }

  const handleGameEnd = (winner: Player) => {
    setGameData(prev => ({ ...prev, winner }))
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
        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h1>🏆 Переможець!</h1>
          <h2>{gameData.winner?.name}</h2>
          <button onClick={() => navigate('start')}>На головну</button>
        </div>
      )
  }
}

export default App
