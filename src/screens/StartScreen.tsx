import { useState } from 'react'
import type { Screen } from '../types'
import { useFullscreen } from '../hooks/useFullscreen'
import { getSavedGamePreview } from '../utils/storage'
import './StartScreen.css'

interface Props {
  onNavigate: (screen: Screen) => void
  onContinueGame: () => void
}

export default function StartScreen({ onNavigate, onContinueGame }: Props) {
  const [soundEnabled, setSoundEnabled] = useState(() =>
    localStorage.getItem('soundEnabled') !== 'false'
  )
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen()
  const savedGamePreview = getSavedGamePreview()

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
        <div className="start-buttons">
          <button className="btn-primary" onClick={() => onNavigate('setup')}>
            Нова гра
          </button>
          {savedGamePreview && (
            <button className="btn-secondary btn-continue" onClick={onContinueGame}>
              <span>Продовжити</span>
              <span className="continue-info">
                {savedGamePreview.players.map(p => p.emoji || '👤').join(' ')} — {savedGamePreview.maxPosition}/{savedGamePreview.boardLength}
              </span>
            </button>
          )}
        </div>
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
