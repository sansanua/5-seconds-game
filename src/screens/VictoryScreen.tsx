// src/screens/VictoryScreen.tsx
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import type { Screen, Player, Cell, PlayerStats } from '../types'
import GameBoard from '../components/GameBoard'
import './VictoryScreen.css'

interface Props {
  winner: Player | null
  players: Player[]
  board: Cell[]
  playerStats: Record<string, PlayerStats>
  onNavigate: (screen: Screen) => void
  onPlayAgain: () => void
  onNewGame: () => void
}

export default function VictoryScreen({
  winner,
  players,
  board,
  playerStats,
  onNavigate,
  onPlayAgain,
  onNewGame
}: Props) {
  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 }
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 }
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  if (!winner) {
    return <div>No winner</div>
  }

  return (
    <div className="victory-screen">
      <div className="victory-content">
        <div className="trophy">🏆</div>
        <h1 className="victory-title">Переможець!</h1>
        <div className="winner-name" style={{ color: winner.color }}>
          {winner.name}
        </div>
      </div>

      <div className="final-board">
        <h3>Фінальні позиції</h3>
        <GameBoard board={board} players={players} />
      </div>

      <div className="player-stats-section">
        <h3>Статистика гравців</h3>
        <div className="stats-cards">
          {players.map(player => {
            const stats = playerStats[player.name] || { correct: 0, wrong: 0, skipped: 0 }
            const total = stats.correct + stats.wrong
            const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0
            return (
              <div key={player.name} className="stats-card">
                <div className="stats-card-header">
                  <span className="stats-player-color" style={{ backgroundColor: player.color }} />
                  <span className="stats-player-name">{player.name}</span>
                </div>
                <div className="stats-card-body">
                  <div className="stat-row">
                    <span className="stat-label">Правильних:</span>
                    <span className="stat-value correct">{stats.correct}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Неправильних:</span>
                    <span className="stat-value wrong">{stats.wrong}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Пропущено:</span>
                    <span className="stat-value skipped">{stats.skipped}</span>
                  </div>
                  <div className="stat-row accuracy">
                    <span className="stat-label">Точність:</span>
                    <span className="stat-value">{accuracy}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="victory-buttons">
        <button className="btn-play-again" onClick={onPlayAgain}>
          🔄 Грати знову
        </button>
        <button className="btn-new-game" onClick={onNewGame}>
          👥 Нова гра
        </button>
        <button className="btn-home" onClick={() => onNavigate('start')}>
          🏠 На головну
        </button>
      </div>
    </div>
  )
}
