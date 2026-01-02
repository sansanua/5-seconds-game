import { useState } from 'react'
import type { Cell, Player } from '../types'
import './GameBoard.css'

interface Props {
  board: Cell[]
  players: Player[]
}

const SPECIAL_ICONS: Record<string, string> = {
  back: '⏪',
  skip: '⏭️',
  swap: '🔄',
  fast: '⏱️',
  double: '❓',
  bonus: '🎁'
}

const SPECIAL_COLORS: Record<string, string> = {
  back: '#e74c3c',
  skip: '#e67e22',
  swap: '#9b59b6',
  fast: '#f1c40f',
  double: '#3498db',
  bonus: '#2ecc71'
}

const SPECIAL_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  back: { name: 'Назад', description: 'Залишаєшся на місці (крок не зараховується)' },
  skip: { name: 'Пропуск', description: 'Пропускаєш наступний хід' },
  swap: { name: 'Поміняйся місцями', description: 'Після правильної відповіді міняєшся позицією з випадковим гравцем' },
  fast: { name: '3 секунди', description: 'Таймер 3 секунди замість 5' },
  double: { name: 'Подвійне питання', description: 'Треба відповісти на 2 питання поспіль' },
  bonus: { name: 'Бонус', description: '+2 кроки замість +1 за правильну відповідь' }
}

export default function GameBoard({ board, players }: Props) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null)

  const getPlayersOnCell = (index: number) =>
    players.filter(p => p.position === index)

  const handleCellClick = (specialType: string | undefined) => {
    if (specialType) {
      setSelectedCell(specialType)
    }
  }

  const closeTooltip = () => setSelectedCell(null)

  return (
    <div className="game-board">
      <div className="board-track">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`cell ${cell.type}${cell.specialType ? ' clickable' : ''}`}
            style={cell.type === 'special' && cell.specialType ? {
              backgroundColor: SPECIAL_COLORS[cell.specialType]
            } : undefined}
            onClick={() => handleCellClick(cell.specialType)}
          >
            {cell.type === 'special' && cell.specialType && (
              <span className="cell-icon">{SPECIAL_ICONS[cell.specialType]}</span>
            )}
            {index === board.length - 1 && (
              <span className="cell-icon">🏁</span>
            )}
            <div className="cell-players">
              {getPlayersOnCell(index).map((player) => (
                <div
                  key={player.name}
                  className="player-token"
                  style={{ backgroundColor: player.color }}
                  title={player.name}
                >
                  {player.name[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedCell && SPECIAL_DESCRIPTIONS[selectedCell] && (
        <div className="tooltip-overlay" onClick={closeTooltip}>
          <div className="tooltip-modal" onClick={e => e.stopPropagation()}>
            <div
              className="tooltip-icon"
              style={{ backgroundColor: SPECIAL_COLORS[selectedCell] }}
            >
              {SPECIAL_ICONS[selectedCell]}
            </div>
            <div className="tooltip-content">
              <h3>{SPECIAL_DESCRIPTIONS[selectedCell].name}</h3>
              <p>{SPECIAL_DESCRIPTIONS[selectedCell].description}</p>
            </div>
            <button className="tooltip-close" onClick={closeTooltip}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
