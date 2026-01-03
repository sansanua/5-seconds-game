// src/hooks/useGameState.ts
import { useReducer, useCallback } from 'react'
import type { GameState, Player, Question, SwapInfo, PlayerStats } from '../types'
import { generateBoard, shuffle } from '../utils/game'
import { questions as allQuestions } from '../data/questions'

const kidsQuestions = allQuestions.filter(q => q.forKids)

const ADULT_TIMER_DURATION_KEY = 'adultTimerDuration'
const CHILD_TIMER_DURATION_KEY = 'childTimerDuration'

function getTimerDurations() {
  const adultDuration = parseInt(localStorage.getItem(ADULT_TIMER_DURATION_KEY) || '5', 10)
  const childDuration = parseInt(localStorage.getItem(CHILD_TIMER_DURATION_KEY) || '10', 10)
  return { adultDuration, childDuration }
}

type GameAction =
  | { type: 'START_COUNTDOWN' }
  | { type: 'COUNTDOWN_END' }
  | { type: 'START_TIMER' }
  | { type: 'TIMER_END' }
  | { type: 'ANSWER_CORRECT' }
  | { type: 'ANSWER_WRONG' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SKIP_QUESTION' }
  | { type: 'SELECT_SWAP_PLAYER'; playerIndex: number }
  | { type: 'DECLINE_SWAP' }
  | { type: 'DISMISS_SWAP' }
  | { type: 'UPDATE_PLAYERS'; players: Player[] }

function getNextPlayerIndex(state: GameState): number {
  let next = (state.currentPlayerIndex + 1) % state.players.length
  // Skip players in skipNextTurn
  while (state.skipNextTurn.includes(next)) {
    next = (next + 1) % state.players.length
  }
  return next
}

function updatePlayerStats(
  stats: Record<string, PlayerStats>,
  playerName: string,
  field: keyof PlayerStats
): Record<string, PlayerStats> {
  const playerStats = stats[playerName] || { correct: 0, wrong: 0, skipped: 0 }
  return {
    ...stats,
    [playerName]: {
      ...playerStats,
      [field]: playerStats[field] + 1
    }
  }
}

function getNextQuestion(state: GameState, forPlayer?: Player): {
  question: Question
  queue: Question[]
  kidsQueue: Question[]
} {
  const player = forPlayer || state.players[state.currentPlayerIndex]

  if (player.isChild) {
    // Kids get only kids questions
    let kidsQueue = state.kidsQuestionsQueue
    if (kidsQueue.length === 0) {
      // Reshuffle kids questions if empty
      kidsQueue = shuffle([...kidsQuestions])
      if (kidsQueue.length === 0) {
        // Fallback: no kids questions, use all questions
        console.warn('No kids questions available, using all questions')
        let queue = state.questionsQueue
        if (queue.length === 0) {
          queue = shuffle([...allQuestions])
        }
        const [question, ...rest] = queue
        return { question, queue: rest, kidsQueue: [] }
      }
    }
    const [question, ...rest] = kidsQueue
    return { question, queue: state.questionsQueue, kidsQueue: rest }
  } else {
    // Adults get all questions
    let queue = state.questionsQueue
    if (queue.length === 0) {
      queue = shuffle([...allQuestions])
    }
    const [question, ...rest] = queue
    return { question, queue: rest, kidsQueue: state.kidsQuestionsQueue }
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_COUNTDOWN':
      return { ...state, phase: 'countdown' }

    case 'COUNTDOWN_END': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const currentCell = state.board[currentPlayer.position]
      const isFast = currentCell.type === 'special' && currentCell.specialType === 'fast'
      const isDouble = currentCell.type === 'special' && currentCell.specialType === 'double'
      const { adultDuration, childDuration } = getTimerDurations()

      // Use settings for timer duration, fast cell reduces by 2 seconds
      const baseDuration = currentPlayer.isChild ? childDuration : adultDuration
      const timerDuration = isFast ? Math.max(1, baseDuration - 2) : baseDuration

      return {
        ...state,
        phase: 'timer',
        timerDuration,
        doubleQuestion: isDouble
      }
    }

    case 'START_TIMER': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const currentCell = state.board[currentPlayer.position]
      const isFast = currentCell.type === 'special' && currentCell.specialType === 'fast'
      const isDouble = currentCell.type === 'special' && currentCell.specialType === 'double'
      const { adultDuration, childDuration } = getTimerDurations()

      // Use settings for timer duration, fast cell reduces by 2 seconds
      const baseDuration = currentPlayer.isChild ? childDuration : adultDuration
      const timerDuration = isFast ? Math.max(1, baseDuration - 2) : baseDuration

      return {
        ...state,
        phase: 'timer',
        timerDuration,
        doubleQuestion: isDouble
      }
    }

    case 'TIMER_END':
      return { ...state, phase: 'judging' }

    case 'ANSWER_CORRECT': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const currentCell = state.board[currentPlayer.position]
      const newStats = updatePlayerStats(state.playerStats, currentPlayer.name, 'correct')

      let moveAmount = 1

      // Handle special cell effects
      if (currentCell.type === 'special') {
        switch (currentCell.specialType) {
          case 'back':
            moveAmount = 0 // Stay in place
            break
          case 'bonus':
            moveAmount = 2
            break
          case 'swap': {
            // Show swap selection UI
            return {
              ...state,
              phase: 'swap_choosing',
              doubleQuestion: false,
              playerStats: newStats
            }
          }
        }
      }

      const newPosition = Math.min(currentPlayer.position + moveAmount, state.board.length - 1)
      const newPlayers = [...state.players]
      newPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: newPosition }

      // Check if player landed on skip cell
      const landedCell = state.board[newPosition]
      let newSkipList = state.skipNextTurn.filter(i => i !== state.currentPlayerIndex)
      if (landedCell.type === 'special' && landedCell.specialType === 'skip') {
        newSkipList = [...newSkipList, state.currentPlayerIndex]
      }

      // Check for winner
      const winner = newPosition >= state.board.length - 1 ? newPlayers[state.currentPlayerIndex] : null
      const nextPlayerIndex = winner ? state.currentPlayerIndex : getNextPlayerIndex({ ...state, skipNextTurn: newSkipList })
      const nextPlayer = newPlayers[nextPlayerIndex]
      const { question, queue, kidsQueue } = getNextQuestion(state, nextPlayer)

      return {
        ...state,
        players: newPlayers,
        phase: winner ? 'effect' : 'waiting',
        winner,
        skipNextTurn: newSkipList,
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: winner ? state.currentQuestion : question,
        questionsQueue: winner ? state.questionsQueue : queue,
        kidsQuestionsQueue: winner ? state.kidsQuestionsQueue : kidsQueue,
        doubleQuestion: false,
        playerStats: newStats
      }
    }

    case 'ANSWER_WRONG': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const newStats = updatePlayerStats(state.playerStats, currentPlayer.name, 'wrong')
      const newSkipList = state.skipNextTurn.filter(i => i !== state.currentPlayerIndex)
      const nextPlayerIndex = getNextPlayerIndex({ ...state, skipNextTurn: newSkipList })
      const nextPlayer = state.players[nextPlayerIndex]
      const { question, queue, kidsQueue } = getNextQuestion(state, nextPlayer)

      return {
        ...state,
        phase: 'waiting',
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: question,
        questionsQueue: queue,
        kidsQuestionsQueue: kidsQueue,
        skipNextTurn: newSkipList,
        doubleQuestion: false,
        playerStats: newStats
      }
    }

    case 'NEXT_QUESTION': {
      const { question, queue, kidsQueue } = getNextQuestion(state)
      return {
        ...state,
        currentQuestion: question,
        questionsQueue: queue,
        kidsQuestionsQueue: kidsQueue
      }
    }

    case 'SKIP_QUESTION': {
      // Skip question without penalty - just get next question for same player
      const currentPlayer = state.players[state.currentPlayerIndex]
      const newStats = updatePlayerStats(state.playerStats, currentPlayer.name, 'skipped')
      const { question, queue, kidsQueue } = getNextQuestion(state)
      return {
        ...state,
        currentQuestion: question,
        questionsQueue: queue,
        kidsQuestionsQueue: kidsQueue,
        phase: 'waiting',
        playerStats: newStats
      }
    }

    case 'SELECT_SWAP_PLAYER': {
      // Swap with selected player
      const currentPlayer = state.players[state.currentPlayerIndex]
      const otherPlayer = state.players[action.playerIndex]
      const newPlayers = [...state.players]
      const currentPlayerOldPos = currentPlayer.position
      const otherPlayerOldPos = otherPlayer.position

      newPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: otherPlayerOldPos }
      newPlayers[action.playerIndex] = { ...otherPlayer, position: currentPlayerOldPos }

      const swapInfo: SwapInfo = {
        currentPlayer: newPlayers[state.currentPlayerIndex],
        otherPlayer: newPlayers[action.playerIndex],
        currentPlayerOldPosition: currentPlayerOldPos,
        otherPlayerOldPosition: otherPlayerOldPos
      }

      return {
        ...state,
        players: newPlayers,
        phase: 'swap_effect',
        swapInfo
      }
    }

    case 'DECLINE_SWAP': {
      // Don't swap, just move forward 1 step
      const currentPlayer = state.players[state.currentPlayerIndex]
      const newPosition = Math.min(currentPlayer.position + 1, state.board.length - 1)
      const newPlayers = [...state.players]
      newPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: newPosition }

      const winner = newPosition >= state.board.length - 1 ? newPlayers[state.currentPlayerIndex] : null
      const newSkipList = state.skipNextTurn.filter(i => i !== state.currentPlayerIndex)
      const nextPlayerIndex = winner ? state.currentPlayerIndex : getNextPlayerIndex({ ...state, skipNextTurn: newSkipList })
      const nextPlayer = newPlayers[nextPlayerIndex]
      const { question, queue, kidsQueue } = getNextQuestion(state, nextPlayer)

      return {
        ...state,
        players: newPlayers,
        phase: winner ? 'effect' : 'waiting',
        winner,
        skipNextTurn: newSkipList,
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: winner ? state.currentQuestion : question,
        questionsQueue: winner ? state.questionsQueue : queue,
        kidsQuestionsQueue: winner ? state.kidsQuestionsQueue : kidsQueue
      }
    }

    case 'DISMISS_SWAP': {
      // After swap UI is dismissed, check for winner and move to next player
      const winner = state.players.find(p => p.position >= state.board.length - 1) || null
      const newSkipList = state.skipNextTurn.filter(i => i !== state.currentPlayerIndex)
      const nextPlayerIndex = winner ? state.currentPlayerIndex : getNextPlayerIndex({ ...state, skipNextTurn: newSkipList })
      const nextPlayer = state.players[nextPlayerIndex]
      const { question, queue, kidsQueue } = getNextQuestion(state, nextPlayer)

      return {
        ...state,
        phase: winner ? 'effect' : 'waiting',
        winner,
        swapInfo: null,
        skipNextTurn: newSkipList,
        currentPlayerIndex: nextPlayerIndex,
        currentQuestion: winner ? state.currentQuestion : question,
        questionsQueue: winner ? state.questionsQueue : queue,
        kidsQuestionsQueue: winner ? state.kidsQuestionsQueue : kidsQueue
      }
    }

    case 'UPDATE_PLAYERS': {
      // Handle adding, removing, and updating players
      const oldPlayerNames = new Set(state.players.map(p => p.name))
      const newPlayerNames = new Set(action.players.map(p => p.name))

      // Build updated players list preserving positions for existing players
      const updatedPlayers: Player[] = action.players.map(newPlayer => {
        // Find matching player by name in current state
        const existingPlayer = state.players.find(p => p.name === newPlayer.name)
        if (existingPlayer) {
          // Existing player - keep position
          return {
            ...newPlayer,
            position: existingPlayer.position
          }
        } else {
          // New player - start at position 0
          return {
            ...newPlayer,
            position: 0
          }
        }
      })

      // Update playerStats
      const newPlayerStats: Record<string, PlayerStats> = {}
      action.players.forEach(player => {
        // Try to find existing stats by name
        const existingStats = state.playerStats[player.name]
        if (existingStats) {
          newPlayerStats[player.name] = existingStats
        } else {
          // New player - initialize stats
          newPlayerStats[player.name] = { correct: 0, wrong: 0, skipped: 0 }
        }
      })

      // Adjust currentPlayerIndex if needed
      let newCurrentPlayerIndex = state.currentPlayerIndex
      const currentPlayerName = state.players[state.currentPlayerIndex]?.name

      if (currentPlayerName && newPlayerNames.has(currentPlayerName)) {
        // Current player still exists - find their new index
        newCurrentPlayerIndex = updatedPlayers.findIndex(p => p.name === currentPlayerName)
      } else {
        // Current player was removed - move to next valid player
        newCurrentPlayerIndex = Math.min(state.currentPlayerIndex, updatedPlayers.length - 1)
        if (newCurrentPlayerIndex < 0) newCurrentPlayerIndex = 0
      }

      // Update skipNextTurn list - remove indices of removed players and remap
      const newSkipList: number[] = []
      state.skipNextTurn.forEach(skipIndex => {
        const skipPlayerName = state.players[skipIndex]?.name
        if (skipPlayerName && newPlayerNames.has(skipPlayerName)) {
          const newIndex = updatedPlayers.findIndex(p => p.name === skipPlayerName)
          if (newIndex >= 0) {
            newSkipList.push(newIndex)
          }
        }
      })

      return {
        ...state,
        players: updatedPlayers,
        playerStats: newPlayerStats,
        currentPlayerIndex: newCurrentPlayerIndex,
        skipNextTurn: newSkipList
      }
    }

    default:
      return state
  }
}

function createInitialState(players: Player[], boardLength: number): GameState {
  const shuffledQuestions = shuffle([...allQuestions])
  const shuffledKidsQuestions = shuffle([...kidsQuestions])

  // First player determines which queue to use for first question
  const firstPlayer = players[0]
  let firstQuestion: Question
  let restQuestions: Question[]
  let restKidsQuestions: Question[]

  if (firstPlayer.isChild && shuffledKidsQuestions.length > 0) {
    [firstQuestion, ...restKidsQuestions] = shuffledKidsQuestions
    restQuestions = shuffledQuestions
  } else {
    [firstQuestion, ...restQuestions] = shuffledQuestions
    restKidsQuestions = shuffledKidsQuestions
  }

  const initialStats: Record<string, PlayerStats> = {}
  players.forEach(p => {
    initialStats[p.name] = { correct: 0, wrong: 0, skipped: 0 }
  })

  return {
    players: players.map(p => ({ ...p, position: 0 })),
    currentPlayerIndex: 0,
    board: generateBoard(boardLength),
    boardLength,
    phase: 'waiting',
    currentQuestion: firstQuestion,
    timerDuration: 5,
    skipNextTurn: [],
    doubleQuestion: false,
    questionsQueue: restQuestions,
    kidsQuestionsQueue: restKidsQuestions,
    winner: null,
    swapInfo: null,
    playerStats: initialStats
  }
}

export function useGameState(players: Player[], boardLength: number) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { players, boardLength },
    ({ players, boardLength }) => createInitialState(players, boardLength)
  )

  const startCountdown = useCallback(() => dispatch({ type: 'START_COUNTDOWN' }), [])
  const countdownEnd = useCallback(() => dispatch({ type: 'COUNTDOWN_END' }), [])
  const startTimer = useCallback(() => dispatch({ type: 'START_TIMER' }), [])
  const timerEnd = useCallback(() => dispatch({ type: 'TIMER_END' }), [])
  const answerCorrect = useCallback(() => dispatch({ type: 'ANSWER_CORRECT' }), [])
  const answerWrong = useCallback(() => dispatch({ type: 'ANSWER_WRONG' }), [])
  const skipQuestion = useCallback(() => dispatch({ type: 'SKIP_QUESTION' }), [])
  const selectSwapPlayer = useCallback((playerIndex: number) => dispatch({ type: 'SELECT_SWAP_PLAYER', playerIndex }), [])
  const declineSwap = useCallback(() => dispatch({ type: 'DECLINE_SWAP' }), [])
  const dismissSwap = useCallback(() => dispatch({ type: 'DISMISS_SWAP' }), [])
  const updatePlayers = useCallback((players: Player[]) => dispatch({ type: 'UPDATE_PLAYERS', players }), [])

  return {
    state,
    startCountdown,
    countdownEnd,
    startTimer,
    timerEnd,
    answerCorrect,
    answerWrong,
    skipQuestion,
    selectSwapPlayer,
    declineSwap,
    dismissSwap,
    updatePlayers
  }
}
