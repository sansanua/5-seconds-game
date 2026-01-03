import type { SavedGame } from '../types'

const SAVED_GAME_KEY = 'five_seconds_saved_game'

export function saveGame(game: SavedGame): void {
  try {
    localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(game))
  } catch (e) {
    console.error('Failed to save game:', e)
  }
}

export function loadGame(): SavedGame | null {
  try {
    const saved = localStorage.getItem(SAVED_GAME_KEY)
    if (!saved) return null
    return JSON.parse(saved) as SavedGame
  } catch (e) {
    console.error('Failed to load game:', e)
    return null
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVED_GAME_KEY)
  } catch (e) {
    console.error('Failed to clear saved game:', e)
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(SAVED_GAME_KEY) !== null
}

export function getSavedGamePreview(): { players: { name: string; emoji?: string }[]; maxPosition: number; boardLength: number } | null {
  const game = loadGame()
  if (!game) return null

  const maxPosition = Math.max(...game.players.map(p => p.position))

  return {
    players: game.players.map(p => ({ name: p.name, emoji: p.emoji })),
    maxPosition,
    boardLength: game.boardLength
  }
}
