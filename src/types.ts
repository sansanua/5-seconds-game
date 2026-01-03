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
}

export type Screen = 'start' | 'setup' | 'game' | 'victory'
