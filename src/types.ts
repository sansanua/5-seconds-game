export interface Player {
  name: string
  color: string
  position: number
  isChild: boolean
  emoji?: string
}

export interface PlayerStats {
  correct: number
  wrong: number
  skipped: number
}

export interface Cell {
  type: 'normal' | 'special'
  specialType?: 'back' | 'skip' | 'swap' | 'fast' | 'double' | 'bonus'
}

export interface Question {
  id: number
  text: string
  forKids: boolean
  difficulty: number // 1-10 scale
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

export const DIFFICULTY_RANGES: Record<DifficultyLevel, { min: number; max: number; label: string }> = {
  easy: { min: 1, max: 3, label: 'Легкий' },
  medium: { min: 4, max: 6, label: 'Середній' },
  hard: { min: 7, max: 8, label: 'Складний' },
  expert: { min: 9, max: 10, label: 'Експерт' }
}

export interface SwapInfo {
  currentPlayer: Player
  otherPlayer: Player
  currentPlayerOldPosition: number
  otherPlayerOldPosition: number
}

export type GamePhase = 'waiting' | 'countdown' | 'timer' | 'judging' | 'effect' | 'swap_choosing' | 'swap_effect'

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  board: Cell[]
  boardLength: number
  phase: GamePhase
  currentQuestion: Question | null
  timerDuration: number
  skipNextTurn: number[]
  doubleQuestion: boolean
  questionsQueue: Question[]
  kidsQuestionsQueue: Question[]
  winner: Player | null
  swapInfo: SwapInfo | null
  playerStats: Record<string, PlayerStats>
  difficultyLevel: DifficultyLevel
}

export type Screen = 'start' | 'setup' | 'game' | 'victory'
