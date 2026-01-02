export interface Player {
  name: string
  color: string
  position: number
}

export interface Cell {
  type: 'normal' | 'special'
  specialType?: 'back' | 'skip' | 'swap' | 'fast' | 'double' | 'bonus'
}

export interface Question {
  id: number
  text: string
}

export interface SwapInfo {
  currentPlayer: Player
  otherPlayer: Player
  currentPlayerOldPosition: number
  otherPlayerOldPosition: number
}

export type GamePhase = 'waiting' | 'timer' | 'judging' | 'effect' | 'swap_choosing' | 'swap_effect'

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  board: Cell[]
  boardLength: number
  phase: GamePhase
  currentQuestion: Question | null
  timerDuration: 5 | 3
  skipNextTurn: number[]
  doubleQuestion: boolean
  questionsQueue: Question[]
  winner: Player | null
  swapInfo: SwapInfo | null
}

export type Screen = 'start' | 'setup' | 'game' | 'victory'
