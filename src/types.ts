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

export type GamePhase = 'waiting' | 'timer' | 'judging' | 'effect'

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
}

export type Screen = 'start' | 'setup' | 'game' | 'victory'
