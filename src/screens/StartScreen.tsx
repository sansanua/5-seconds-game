import { useState } from 'react'
import { Screen } from '../types'
import './StartScreen.css'

interface Props {
  onNavigate: (screen: Screen) => void
}

export default function StartScreen({ onNavigate }: Props) {
  const [soundEnabled, setSoundEnabled] = useState(() =>
    localStorage.getItem('soundEnabled') !== 'false'
  )

  const toggleSound = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    localStorage.setItem('soundEnabled', String(newValue))
  }

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="title">5 Second Rule</h1>
        <p className="subtitle">Назви 3 речі за 5 секунд!</p>
        <button className="btn-primary" onClick={() => onNavigate('setup')}>
          Нова гра
        </button>
      </div>
      <button className="btn-sound" onClick={toggleSound}>
        {soundEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  )
}
