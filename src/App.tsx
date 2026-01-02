import { useState } from 'react'
import { Screen } from './types'
import './App.css'

// Placeholder components until real ones are created
const StartScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => (
  <div><h1>5 Second Rule</h1><button onClick={() => onNavigate('setup')}>Нова гра</button></div>
)
const SetupScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => (
  <div><h2>Setup</h2><button onClick={() => onNavigate('game')}>Start</button></div>
)
const GameScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => (
  <div><h2>Game</h2><button onClick={() => onNavigate('victory')}>Win</button></div>
)
const VictoryScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => (
  <div><h2>Victory!</h2><button onClick={() => onNavigate('start')}>Home</button></div>
)

function App() {
  const [screen, setScreen] = useState<Screen>('start')

  const navigate = (newScreen: Screen) => setScreen(newScreen)

  switch (screen) {
    case 'start':
      return <StartScreen onNavigate={navigate} />
    case 'setup':
      return <SetupScreen onNavigate={navigate} />
    case 'game':
      return <GameScreen onNavigate={navigate} />
    case 'victory':
      return <VictoryScreen onNavigate={navigate} />
  }
}

export default App
