// src/utils/playerDisplay.ts

/**
 * Get player initials for display (2 chars for better differentiation)
 */
export function getPlayerInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '??'

  // If name has 2+ characters, return first 2
  if (trimmed.length >= 2) {
    return trimmed.slice(0, 2).toUpperCase()
  }

  // Single character name
  return trimmed[0].toUpperCase()
}
