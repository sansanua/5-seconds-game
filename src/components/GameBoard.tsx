import { useState, useRef, useEffect, useCallback } from 'react'
import type { Cell, Player } from '../types'
import './GameBoard.css'

interface Props {
  board: Cell[]
  players: Player[]
}

interface CellPosition {
  x: number
  y: number
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
  const [cellPositions, setCellPositions] = useState<CellPosition[]>([])
  const boardRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])

  // Calculate cell positions for absolute token positioning
  const updateCellPositions = useCallback(() => {
    if (!boardRef.current) return

    const boardRect = boardRef.current.getBoundingClientRect()
    const positions: CellPosition[] = []

    cellRefs.current.forEach((cellEl) => {
      if (cellEl) {
        const cellRect = cellEl.getBoundingClientRect()
        positions.push({
          x: cellRect.left - boardRect.left + cellRect.width / 2,
          y: cellRect.top - boardRect.top + cellRect.height / 2
        })
      }
    })

    setCellPositions(positions)
  }, [])

  // Use ResizeObserver for position updates
  useEffect(() => {
    if (!boardRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      updateCellPositions()
    })

    resizeObserver.observe(boardRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateCellPositions, board.length])

  const handleCellClick = (specialType: string | undefined) => {
    if (specialType) {
      setSelectedCell(specialType)
    }
  }

  const closeTooltip = () => setSelectedCell(null)

  // Group players by position for stacking
  const getPlayersAtPosition = (position: number) =>
    players.filter(p => p.position === position)

  return (
    <div className="game-board" ref={boardRef}>
      <div className="board-track">
        {board.map((cell, index) => (
          <div
            key={index}
            ref={(el) => { cellRefs.current[index] = el }}
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
          </div>
        ))}
      </div>

      {/* Animated player tokens layer */}
      <div className="player-tokens-layer">
        {players.map((player) => {
          const position = cellPositions[player.position]
          if (!position) return null

          // Calculate offset for multiple players on same cell
          const playersAtSameCell = getPlayersAtPosition(player.position)
          const playerIndex = playersAtSameCell.findIndex(p => p.name === player.name)
          const totalAtCell = playersAtSameCell.length
          const offsetX = totalAtCell > 1
            ? (playerIndex - (totalAtCell - 1) / 2) * 14
            : 0

          return (
            <div
              key={player.name}
              className="player-token animated"
              style={{
                backgroundColor: player.color,
                transform: `translate(${position.x + offsetX - 10}px, ${position.y + 10}px)`
              }}
              title={player.name}
            >
              {player.name[0].toUpperCase()}
            </div>
          )
        })}
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
