// src/screens/VictoryScreen.tsx
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import type { Screen, Player, Cell } from '../types'
import GameBoard from '../components/GameBoard'
import './VictoryScreen.css'

interface Props {
  winner: Player | null
  players: Player[]
  board: Cell[]
  onNavigate: (screen: Screen) => void
  onPlayAgain: () => void
  onNewGame: () => void
}

export default function VictoryScreen({
  winner,
  players,
  board,
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
