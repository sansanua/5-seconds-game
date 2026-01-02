// src/screens/SetupScreen.tsx
import { useState } from 'react'
import type { Screen, Player } from '../types'
import { PLAYER_COLORS } from '../utils/game'
import './SetupScreen.css'

interface Props {
  onNavigate: (screen: Screen) => void
  onStartGame: (players: Player[], boardLength: number) => void
}

export default function SetupScreen({ onNavigate, onStartGame }: Props) {
  const [players, setPlayers] = useState<Player[]>([])
  const [newName, setNewName] = useState('')
  const [boardLength, setBoardLength] = useState<10 | 15 | 20>(15)

  const addPlayer = () => {
    const name = newName.trim()
    if (!name || players.some(p => p.name === name)) return

    setPlayers([...players, {
      name,
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
      position: 0
    }])
    setNewName('')
  }

  const removePlayer = (name: string) => {
    setPlayers(players.filter(p => p.name !== name))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addPlayer()
  }

  const startGame = () => {
    if (players.length >= 2) {
      onStartGame(players, boardLength)
      onNavigate('game')
    }
  }

  return (
    <div className="setup-screen">
      <button className="btn-back" onClick={() => onNavigate('start')}>
        ← Назад
      </button>

      <h2>Нова гра</h2>

      <div className="players-section">
        <h3>Гравці ({players.length})</h3>
        <div className="players-list">
          {players.map(player => (
            <div key={player.name} className="player-item">
              <span className="player-color" style={{ backgroundColor: player.color }} />
              <span className="player-name">{player.name}</span>
              <button className="btn-remove" onClick={() => removePlayer(player.name)}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="add-player">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ім'я гравця"
            maxLength={20}
          />
          <button onClick={addPlayer} disabled={!newName.trim()}>
            + Додати
          </button>
        </div>
      </div>

      <div className="board-length-section">
        <h3>Довжина поля</h3>
        <div className="length-buttons">
          {([10, 15, 20] as const).map(len => (
            <button
              key={len}
              className={`btn-length ${boardLength === len ? 'active' : ''}`}
              onClick={() => setBoardLength(len)}
            >
              {len}
              <span className="length-hint">
                {len === 10 ? '~10хв' : len === 15 ? '~20хв' : '~30хв'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-start"
        onClick={startGame}
        disabled={players.length < 2}
      >
        {players.length < 2
          ? `Додайте ще ${2 - players.length} гравців`
          : 'Почати гру'}
      </button>
    </div>
  )
}
