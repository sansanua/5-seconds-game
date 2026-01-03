// src/screens/SetupScreen.tsx
import { useState, useRef, useEffect } from 'react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import type { EmojiClickData } from 'emoji-picker-react'
import type { Screen, Player } from '../types'
import { PLAYER_COLORS } from '../utils/game'
import { getPlayerInitials } from '../utils/playerDisplay'
import './SetupScreen.css'

export interface SetupScreenProps {
  onNavigate: (screen: Screen) => void
  onStartGame: (players: Player[], boardLength: number) => void
  // Edit mode props
  mode?: 'setup' | 'edit'
  initialPlayers?: Player[]
  initialBoardLength?: number
  onSave?: (players: Player[]) => void
  onClose?: () => void
}

const SHOW_QUESTION_IMMEDIATELY_KEY = 'showQuestionImmediately'
const ADULT_TIMER_DURATION_KEY = 'adultTimerDuration'
const CHILD_TIMER_DURATION_KEY = 'childTimerDuration'

export default function SetupScreen({
  onNavigate,
  onStartGame,
  mode = 'setup',
  initialPlayers = [],
  initialBoardLength = 15,
  onSave,
  onClose
}: SetupScreenProps) {
  const isEditMode = mode === 'edit'
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [newName, setNewName] = useState('')
  const [isChild, setIsChild] = useState(false)
  const [boardLength, setBoardLength] = useState<10 | 15 | 20>(initialBoardLength as 10 | 15 | 20)
  const [showQuestionImmediately, setShowQuestionImmediately] = useState(() => {
    return localStorage.getItem(SHOW_QUESTION_IMMEDIATELY_KEY) === 'true'
  })
  const [adultTimerDuration, setAdultTimerDuration] = useState(() => {
    const saved = localStorage.getItem(ADULT_TIMER_DURATION_KEY)
    return saved ? parseInt(saved, 10) : 5
  })
  const [childTimerDuration, setChildTimerDuration] = useState(() => {
    const saved = localStorage.getItem(CHILD_TIMER_DURATION_KEY)
    return saved ? parseInt(saved, 10) : 10
  })
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Reset state when initialPlayers changes (for edit mode)
  useEffect(() => {
    if (isEditMode) {
      setPlayers(initialPlayers)
    }
  }, [initialPlayers, isEditMode])

  const handleShowQuestionImmediatelyChange = (checked: boolean) => {
    setShowQuestionImmediately(checked)
    localStorage.setItem(SHOW_QUESTION_IMMEDIATELY_KEY, String(checked))
  }

  const handleAdultTimerChange = (value: number) => {
    const newValue = Math.max(1, Math.min(60, value))
    setAdultTimerDuration(newValue)
    localStorage.setItem(ADULT_TIMER_DURATION_KEY, String(newValue))
  }

  const handleChildTimerChange = (value: number) => {
    const newValue = Math.max(1, Math.min(60, value))
    setChildTimerDuration(newValue)
    localStorage.setItem(CHILD_TIMER_DURATION_KEY, String(newValue))
  }

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEditingPlayerIndex(null)
      }
    }

    if (editingPlayerIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingPlayerIndex])

  const addPlayer = () => {
    const name = newName.trim()
    if (!name || players.some(p => p.name === name)) return

    setPlayers([...players, {
      name,
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
      position: 0,
      isChild
    }])
    setNewName('')
    setIsChild(false)
  }

  const removePlayer = (name: string) => {
    setPlayers(players.filter(p => p.name !== name))
    setEditingPlayerIndex(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addPlayer()
  }

  const handleEmojiClick = (emojiData: EmojiClickData, playerIndex: number) => {
    setPlayers(players.map((p, i) =>
      i === playerIndex ? { ...p, emoji: emojiData.emoji } : p
    ))
    setEditingPlayerIndex(null)
  }

  const handleRemoveEmoji = (playerIndex: number) => {
    setPlayers(players.map((p, i) =>
      i === playerIndex ? { ...p, emoji: undefined } : p
    ))
    setEditingPlayerIndex(null)
  }

  const handleAvatarClick = (index: number) => {
    setEditingPlayerIndex(editingPlayerIndex === index ? null : index)
  }

  const startGame = () => {
    if (players.length >= 2) {
      onStartGame(players, boardLength)
      onNavigate('game')
    }
  }

  const handleSave = () => {
    if (players.length >= 2 && onSave) {
      onSave(players)
    }
  }

  const handleBack = () => {
    if (isEditMode && onClose) {
      onClose()
    } else {
      onNavigate('start')
    }
  }

  return (
    <div className={`setup-screen ${isEditMode ? 'edit-mode' : ''}`}>
      <button className="btn-back" onClick={handleBack}>
        ← {isEditMode ? 'Скасувати' : 'Назад'}
      </button>

      <h2>{isEditMode ? 'Налаштування гри' : 'Нова гра'}</h2>

      <div className="players-section">
        <h3>Гравці ({players.length})</h3>
        <div className="players-list">
          {players.map((player, index) => (
            <div key={player.name} className={`player-item ${player.isChild ? 'player-child' : ''}`}>
              <button
                className="player-avatar-btn"
                onClick={() => handleAvatarClick(index)}
                title="Натисніть щоб змінити емодзі"
              >
                {player.emoji ? (
                  <span className="player-emoji">{player.emoji}</span>
                ) : (
                  <span
                    className="player-color"
                    style={{ backgroundColor: player.color }}
                  >
                    {getPlayerInitials(player.name)}
                  </span>
                )}
              </button>
              {editingPlayerIndex === index && (
                <div className="emoji-picker-popup" ref={emojiPickerRef}>
                  <div className="emoji-picker-header">
                    {player.emoji && (
                      <button
                        className="btn-remove-emoji"
                        onClick={() => handleRemoveEmoji(index)}
                      >
                        Видалити емодзі
                      </button>
                    )}
                  </div>
                  <EmojiPicker
                    onEmojiClick={(data) => handleEmojiClick(data, index)}
                    theme={Theme.DARK}
                    width={340}
                    height={420}
                    searchPlaceholder="Пошук..."
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
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
          <label className="child-checkbox">
            <input
              type="checkbox"
              checked={isChild}
              onChange={e => setIsChild(e.target.checked)}
            />
            Дитина
          </label>
          <button onClick={addPlayer} disabled={!newName.trim()}>
            + Додати
          </button>
        </div>
      </div>

      <div className={`board-length-section ${isEditMode ? 'readonly' : ''}`}>
        <h3>Довжина поля {isEditMode && <span className="readonly-hint">(не можна змінити під час гри)</span>}</h3>
        <div className="length-buttons">
          {([10, 15, 20] as const).map(len => (
            <button
              key={len}
              className={`btn-length ${boardLength === len ? 'active' : ''}`}
              onClick={() => !isEditMode && setBoardLength(len)}
              disabled={isEditMode}
            >
              {len}
              <span className="length-hint">
                {len === 10 ? '~10хв' : len === 15 ? '~20хв' : '~30хв'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Налаштування</h3>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={showQuestionImmediately}
            onChange={e => handleShowQuestionImmediatelyChange(e.target.checked)}
          />
          <span className="setting-label">Показувати питання одразу</span>
          <span className="setting-hint">
            {showQuestionImmediately
              ? 'Питання видно відразу, таймер стартує по кнопці'
              : 'Питання приховане (???), після кнопки - зворотний відлік 3-2-1'}
          </span>
        </label>

        <div className="timer-settings">
          <div className="timer-setting">
            <label htmlFor="adult-timer">Час для дорослих (сек)</label>
            <input
              id="adult-timer"
              type="number"
              min="1"
              max="60"
              value={adultTimerDuration}
              onChange={e => handleAdultTimerChange(parseInt(e.target.value, 10) || 5)}
            />
          </div>
          <div className="timer-setting">
            <label htmlFor="child-timer">Час для дітей (сек)</label>
            <input
              id="child-timer"
              type="number"
              min="1"
              max="60"
              value={childTimerDuration}
              onChange={e => handleChildTimerChange(parseInt(e.target.value, 10) || 10)}
            />
          </div>
          <span className="setting-hint timer-hint">
            Швидка клітинка зменшує час на 2 секунди
          </span>
        </div>
      </div>

      <button
        className="btn-start"
        onClick={isEditMode ? handleSave : startGame}
        disabled={players.length < 2}
      >
        {players.length < 2
          ? `Додайте ще ${2 - players.length} гравців`
          : isEditMode ? 'Зберегти' : 'Почати гру'}
      </button>
    </div>
  )
}
