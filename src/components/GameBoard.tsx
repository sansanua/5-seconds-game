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

export default function GameBoard({ board, players }: Props) {
  const getPlayersOnCell = (index: number) =>
    players.filter(p => p.position === index)

  return (
    <div className="game-board">
      <div className="board-track">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`cell ${cell.type}`}
            style={cell.type === 'special' && cell.specialType ? {
              backgroundColor: SPECIAL_COLORS[cell.specialType]
            } : undefined}
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
    </div>
  )
}
