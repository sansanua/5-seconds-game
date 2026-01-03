// src/screens/GameScreen.tsx
import { useCallback, useEffect, useState } from 'react'
import type { Screen, Player, Cell, PlayerStats } from '../types'
import { useGameState } from '../hooks/useGameState'
import { useFullscreen } from '../hooks/useFullscreen'
import GameBoard from '../components/GameBoard'
import Timer from '../components/Timer'
import SetupScreen from './SetupScreen'
import './GameScreen.css'

const SHOW_QUESTION_IMMEDIATELY_KEY = 'showQuestionImmediately'

interface Props {
  players: Player[]
  boardLength: number
  onNavigate: (screen: Screen) => void
  onGameEnd: (winner: Player, board: Cell[], playerStats: Record<string, PlayerStats>) => void
  onUpdatePlayers: (players: Player[]) => void
}

const SPECIAL_MESSAGES: Record<string, string> = {
  back: '⏪ Назад на 1!',
  skip: '⏭️ Пропуск наступного ходу!',
  swap: '🔄 Поміняйся місцями!',
  fast: '⏱️ Тільки 3 секунди!',
  double: '❓ Подвійне питання!',
  bonus: '🎁 Бонус +1!'
}

export default function GameScreen({ players, boardLength, onNavigate, onGameEnd, onUpdatePlayers }: Props) {
  const { state, startCountdown, countdownEnd, startTimer, timerEnd, answerCorrect, answerWrong, skipQuestion, selectSwapPlayer, declineSwap, dismissSwap, updatePlayers } = useGameState(players, boardLength)
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen()

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false)

  // Show question immediately setting
  const [showQuestionImmediately, setShowQuestionImmediately] = useState(() => {
    return localStorage.getItem(SHOW_QUESTION_IMMEDIATELY_KEY) === 'true'
  })

  // Countdown state
  const [countdownValue, setCountdownValue] = useState<number | null>(null)

  // Countdown timer effect
  useEffect(() => {
    if (state.phase === 'countdown') {
      setCountdownValue(3)
    } else {
      setCountdownValue(null)
    }
  }, [state.phase])

  useEffect(() => {
    if (countdownValue === null) return

    if (countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue(countdownValue - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Countdown finished, start the timer
      countdownEnd()
    }
  }, [countdownValue, countdownEnd])

  // Handler for "Поїхали" button
  const handleStartButton = useCallback(() => {
    const currentPlayer = state.players[state.currentPlayerIndex]
    // If showQuestionImmediately is ON or current player is a child, skip countdown
    if (showQuestionImmediately || currentPlayer.isChild) {
      startTimer()
    } else {
      startCountdown()
    }
  }, [showQuestionImmediately, state.players, state.currentPlayerIndex, startTimer, startCountdown])

  const openSettings = () => {
    setShowSettings(true)
  }

  const closeSettings = () => {
    setShowSettings(false)
  }

  const handleSaveSettings = (editedPlayers: Player[]) => {
    // Update game state players and notify parent
    updatePlayers(editedPlayers)
    onUpdatePlayers(editedPlayers)
    setShowSettings(false)
  }

  const handleBack = () => {
    onNavigate('start')
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const currentCell = state.board[currentPlayer.position]
  const specialMessage = currentCell.type === 'special' && currentCell.specialType
    ? SPECIAL_MESSAGES[currentCell.specialType]
    : null

  // Determine timer duration display
  const isFastCell = currentCell.type === 'special' && currentCell.specialType === 'fast'
  const timerDurationDisplay = currentPlayer.isChild
    ? '10 сек'
    : isFastCell
      ? '3 сек'
      : '5 сек'
  const timerEmoji = currentPlayer.isChild ? ' \u{1F476}' : isFastCell ? ' \u26A1' : ''

  // Determine if question should be visible
  // Question is visible if:
  // 1. showQuestionImmediately setting is ON, OR
  // 2. Current player is a child (isChild), OR
  // 3. Phase is 'countdown' (reading time), 'timer' or 'judging'
  const shouldShowQuestion = showQuestionImmediately ||
    currentPlayer.isChild ||
    state.phase === 'countdown' ||
    state.phase === 'timer' ||
    state.phase === 'judging'

  // Handle winner
  useEffect(() => {
    if (state.winner) {
      onGameEnd(state.winner, state.board, state.playerStats)
      onNavigate('victory')
    }
  }, [state.winner, state.board, state.playerStats, onGameEnd, onNavigate])

  const handleTimerComplete = useCallback(() => {
    // Trigger vibration on mobile devices if sound is enabled
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false'
    if (soundEnabled && 'vibrate' in navigator) {
      navigator.vibrate(200)
    }
    timerEnd()
  }, [timerEnd])

  return (
    <div className="game-screen">
      {/* Navigation buttons */}
      <button className="btn-back-game" onClick={handleBack} title="Повернутися на головну">
        &#x2190;
      </button>
      <button className="btn-settings-game" onClick={openSettings} title="Налаштування гравців">
        &#x2699;
      </button>

      <div className="game-board-section">
        <GameBoard board={state.board} players={state.players} />
      </div>

      <div className="question-section">
        <div className="current-player">
          {currentPlayer.emoji ? (
            <span className="player-indicator-emoji">{currentPlayer.emoji}</span>
          ) : (
            <span
              className="player-indicator"
              style={{ backgroundColor: currentPlayer.color }}
            />
          )}
          <div className="player-name-stats">
            <span className="player-name">{currentPlayer.name}</span>
            <span className="player-mini-stats">
              {state.playerStats[currentPlayer.name]?.correct || 0} |{' '}
              {state.playerStats[currentPlayer.name]?.wrong || 0}
            </span>
          </div>
        </div>

        {specialMessage && (
          <div className="special-message">{specialMessage}</div>
        )}

        <div className={`question-card ${state.phase === 'judging' ? 'shake' : ''} ${!shouldShowQuestion ? 'question-hidden' : ''}`}>
          {shouldShowQuestion ? state.currentQuestion?.text : '???'}
        </div>

        {state.doubleQuestion && (
          <div className="double-indicator">Питання 1 з 2</div>
        )}
      </div>

      <div className="controls-section">
        <div className="timer-container">
          {state.phase === 'countdown' && countdownValue !== null && countdownValue > 0 ? (
            <div className="countdown-number" key={countdownValue}>
              {countdownValue}
            </div>
          ) : (
            <Timer
              duration={state.timerDuration}
              isRunning={state.phase === 'timer'}
              onComplete={handleTimerComplete}
            />
          )}
        </div>

        <div className="buttons-container">
          {state.phase === 'waiting' && (
            <div className="waiting-buttons">
              <button className="btn-skip" onClick={skipQuestion}>
                Пропустити ⏭️
              </button>
              <div className="start-timer-group">
                <span className="timer-duration-hint">{timerDurationDisplay}{timerEmoji}</span>
                <button className="btn-start-timer" onClick={handleStartButton}>
                  Поїхали! 🚀
                </button>
              </div>
            </div>
          )}

          {state.phase === 'countdown' && (
            <div className="countdown-hint">
              Читайте питання...
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
              {currentPlayer.emoji ? (
                <span className="swap-player-emoji">{currentPlayer.emoji}</span>
              ) : (
                <span
                  className="swap-player-color"
                  style={{ backgroundColor: currentPlayer.color }}
                />
              )}
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
                    {player.emoji ? (
                      <span className="swap-player-emoji">{player.emoji}</span>
                    ) : (
                      <span
                        className="swap-player-color"
                        style={{ backgroundColor: player.color }}
                      />
                    )}
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
                {state.swapInfo.currentPlayer.emoji ? (
                  <span className="swap-player-emoji">{state.swapInfo.currentPlayer.emoji}</span>
                ) : (
                  <span
                    className="swap-player-color"
                    style={{ backgroundColor: state.swapInfo.currentPlayer.color }}
                  />
                )}
                <span className="swap-player-name">{state.swapInfo.currentPlayer.name}</span>
                <span className="swap-position">
                  {state.swapInfo.currentPlayerOldPosition + 1} → {state.swapInfo.otherPlayerOldPosition + 1}
                </span>
              </div>
              <div className="swap-arrow">⇄</div>
              <div className="swap-player">
                {state.swapInfo.otherPlayer.emoji ? (
                  <span className="swap-player-emoji">{state.swapInfo.otherPlayer.emoji}</span>
                ) : (
                  <span
                    className="swap-player-color"
                    style={{ backgroundColor: state.swapInfo.otherPlayer.color }}
                  />
                )}
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

      {/* Settings Screen (using SetupScreen in edit mode) */}
      {showSettings && (
        <SetupScreen
          mode="edit"
          initialPlayers={state.players}
          initialBoardLength={boardLength}
          onNavigate={onNavigate}
          onStartGame={() => {}}
          onSave={handleSaveSettings}
          onClose={closeSettings}
        />
      )}

      {isSupported && (
        <button className="btn-fullscreen-corner" onClick={toggleFullscreen}>
          {isFullscreen ? '⛶' : '⛶'}
        </button>
      )}
    </div>
  )
}
