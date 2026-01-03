import type { Cell } from '../types'

const SPECIAL_TYPES = ['back', 'skip', 'swap', 'fast', 'double', 'bonus'] as const

// Fisher-Yates shuffle
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Generate board with optional special cells every 5th position
export function generateBoard(length: number, enableSpecialCells: boolean = true): Cell[] {
  const board: Cell[] = []
  for (let i = 0; i < length; i++) {
    // Special cell every 5th position (indices 4, 9, 14...), but not first or last
    if (enableSpecialCells && i > 0 && i < length - 1 && (i + 1) % 5 === 0) {
      board.push({
        type: 'special',
        specialType: SPECIAL_TYPES[Math.floor(Math.random() * SPECIAL_TYPES.length)]
      })
    } else {
      board.push({ type: 'normal' })
    }
  }
  return board
}

// Player colors palette
export const PLAYER_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#e67e22', // dark orange
  '#34495e', // dark gray
  '#e91e63', // pink
  '#00bcd4', // cyan
]
