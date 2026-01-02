// src/screens/GameScreen.tsx
import { useCallback, useEffect } from 'react'
import type { Screen, Player, Cell } from '../types'
import { useGameState } from '../hooks/useGameState'
import GameBoard from '../components/GameBoard'
import Timer from '../components/Timer'
import './GameScreen.css'

interface Props {
  players: Player[]
  boardLength: number
  onNavigate: (screen: Screen) => void
  onGameEnd: (winner: Player, board: Cell[]) => void
}

const SPECIAL_MESSAGES: Record<string, string> = {
  back: '⏪ Назад на 1!',
  skip: '⏭️ Пропуск наступного ходу!',
  swap: '🔄 Поміняйся місцями!',
  fast: '⏱️ Тільки 3 секунди!',
  double: '❓ Подвійне питання!',
  bonus: '🎁 Бонус +1!'
}

export default function GameScreen({ players, boardLength, onNavigate, onGameEnd }: Props) {
  const { state, startTimer, timerEnd, answerCorrect, answerWrong, skipQuestion, selectSwapPlayer, declineSwap, dismissSwap } = useGameState(players, boardLength)

  const currentPlayer = state.players[state.currentPlayerIndex]
  const currentCell = state.board[currentPlayer.position]
  const specialMessage = currentCell.type === 'special' && currentCell.specialType
    ? SPECIAL_MESSAGES[currentCell.specialType]
    : null

  // Handle winner
  useEffect(() => {
    if (state.winner) {
      onGameEnd(state.winner, state.board)
      onNavigate('victory')
    }
  }, [state.winner, state.board, onGameEnd, onNavigate])

  const handleTimerComplete = useCallback(() => {
    timerEnd()
  }, [timerEnd])

  return (
    <div className="game-screen">
      <div className="game-board-section">
        <GameBoard board={state.board} players={state.players} />
      </div>

      <div className="question-section">
        <div className="current-player">
          <span
            className="player-indicator"
            style={{ backgroundColor: currentPlayer.color }}
          />
          {currentPlayer.name}
        </div>

        {specialMessage && (
          <div className="special-message">{specialMessage}</div>
        )}

        <div className="question-card">
          {state.currentQuestion?.text}
        </div>

        {state.doubleQuestion && (
          <div className="double-indicator">Питання 1 з 2</div>
        )}
      </div>

      <div className="controls-section">
        <div className="timer-container">
          <Timer
            duration={state.timerDuration}
            isRunning={state.phase === 'timer'}
            onComplete={handleTimerComplete}
          />
        </div>

        <div className="buttons-container">
          {state.phase === 'waiting' && (
            <div className="waiting-buttons">
              <button className="btn-skip" onClick={skipQuestion}>
                Пропустити ⏭️
              </button>
              <button className="btn-start-timer" onClick={startTimer}>
                Поїхали! 🚀
              </button>
            </div>
          )}

          {state.phase === 'judging' && (
            <div className="judging-buttons">
              <button className="btn-wrong" onClick={answerWrong}>
                ❌
              </button>
              <button className="btn-correct" onClick={answerCorrect}>
                ✅
              </button>
            </div>
          )}
        </div>
      </div>

      {state.phase === 'swap_choosing' && (
        <div className="swap-modal-overlay">
          <div className="swap-modal swap-choosing">
            <div className="swap-modal-title">🔄 Обмін позиціями</div>
            <div className="swap-choosing-subtitle">
              <span
                className="swap-player-color"
                style={{ backgroundColor: currentPlayer.color }}
              />
              <span>{currentPlayer.name}</span>
              <span className="swap-choosing-position">(позиція {currentPlayer.position + 1})</span>
            </div>
            <div className="swap-choosing-label">З ким обмінятися?</div>
            <div className="swap-choosing-options">
              {state.players
                .map((player, index) => ({ player, index }))
                .filter(({ index }) => index !== state.currentPlayerIndex)
                .map(({ player, index }) => (
                  <button
                    key={index}
                    className="swap-player-btn"
                    onClick={() => selectSwapPlayer(index)}
                  >
                    <span
                      className="swap-player-color"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="swap-player-btn-name">{player.name}</span>
                    <span className="swap-player-btn-position">позиція {player.position + 1}</span>
                  </button>
                ))}
            </div>
            <button className="swap-decline-btn" onClick={declineSwap}>
              Не хочу обмінюватися
            </button>
          </div>
        </div>
      )}

      {state.phase === 'swap_effect' && state.swapInfo && (
        <div className="swap-modal-overlay">
          <div className="swap-modal">
            <div className="swap-modal-title">🔄 Обмін позиціями!</div>
            <div className="swap-modal-content">
              <div className="swap-player">
                <span
                  className="swap-player-color"
                  style={{ backgroundColor: state.swapInfo.currentPlayer.color }}
                />
                <span className="swap-player-name">{state.swapInfo.currentPlayer.name}</span>
                <span className="swap-position">
                  {state.swapInfo.currentPlayerOldPosition + 1} → {state.swapInfo.otherPlayerOldPosition + 1}
                </span>
              </div>
              <div className="swap-arrow">⇄</div>
              <div className="swap-player">
                <span
                  className="swap-player-color"
                  style={{ backgroundColor: state.swapInfo.otherPlayer.color }}
                />
                <span className="swap-player-name">{state.swapInfo.otherPlayer.name}</span>
                <span className="swap-position">
                  {state.swapInfo.otherPlayerOldPosition + 1} → {state.swapInfo.currentPlayerOldPosition + 1}
                </span>
              </div>
            </div>
            <button className="swap-modal-btn" onClick={dismissSwap}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
