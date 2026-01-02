import { useState } from 'react'
import type { Screen } from '../types'
import { useFullscreen } from '../hooks/useFullscreen'
import './StartScreen.css'

interface Props {
  onNavigate: (screen: Screen) => void
}

export default function StartScreen({ onNavigate }: Props) {
  const [soundEnabled, setSoundEnabled] = useState(() =>
    localStorage.getItem('soundEnabled') !== 'false'
  )
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen()

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
      <div className="settings-buttons">
        {isSupported && (
          <button className="btn-setting" onClick={toggleFullscreen}>
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        )}
        <button className="btn-setting" onClick={toggleSound}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    </div>
  )
}
