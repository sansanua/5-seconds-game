// src/hooks/useGameState.ts
import { useReducer, useCallback } from 'react'
import type { GameState, Player, Question, SwapInfo, PlayerStats, DifficultyLevel } from '../types'
import { DIFFICULTY_RANGES } from '../types'
import { generateBoard, shuffle } from '../utils/game'
import { questions as allQuestions } from '../data/questions'

function filterByDifficulty(questions: Question[], level: DifficultyLevel): Question[] {
  const { min, max } = DIFFICULTY_RANGES[level]
  return questions.filter(q => q.difficulty >= min && q.difficulty <= max)
}

export function getFilteredQuestions(level: DifficultyLevel) {
  const filtered = filterByDifficulty(allQuestions, level)
  const kidsFiltered = filtered.filter(q => q.forKids)
  return { filtered, kidsFiltered }
}

const ADULT_TIMER_DURATION_KEY = 'adultTimerDuration'
const CHILD_TIMER_DURATION_KEY = 'childTimerDuration'
const ENABLE_SPECIAL_CELLS_KEY = 'enableSpecialCells'

function getTimerDurations() {
  const adultDuration = parseInt(localStorage.getItem(ADULT_TIMER_DURATION_KEY) || '5', 10)
  const childDuration = parseInt(localStorage.getItem(CHILD_TIMER_DURATION_KEY) || '10', 10)
  return { adultDuration, childDuration }
}

function getEnableSpecialCells(): boolean {
  return localStorage.getItem(ENABLE_SPECIAL_CELLS_KEY) !== 'false'
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
  | { type: 'CHANGE_DIFFICULTY'; level: DifficultyLevel }

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
  const { filtered, kidsFiltered } = getFilteredQuestions(state.difficultyLevel)

  if (player.isChild) {
    // Kids get only kids questions filtered by difficulty
    let kidsQueue = state.kidsQuestionsQueue
    if (kidsQueue.length === 0) {
      // Reshuffle kids questions if empty
      kidsQueue = shuffle([...kidsFiltered])
      if (kidsQueue.length === 0) {
        // Fallback: no kids questions for this difficulty, use all filtered questions
        console.warn('No kids questions available for this difficulty, using all filtered questions')
        let queue = state.questionsQueue
        if (queue.length === 0) {
          queue = shuffle([...filtered])
        }
        if (queue.length === 0) {
          // Ultimate fallback: use all questions
          queue = shuffle([...allQuestions])
        }
        const [question, ...rest] = queue
        return { question, queue: rest, kidsQueue: [] }
      }
    }
    const [question, ...rest] = kidsQueue
    return { question, queue: state.questionsQueue, kidsQueue: rest }
  } else {
    // Adults get questions filtered by difficulty
    let queue = state.questionsQueue
    if (queue.length === 0) {
      queue = shuffle([...filtered])
      if (queue.length === 0) {
        // Fallback: use all questions
        queue = shuffle([...allQuestions])
      }
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

    case 'CHANGE_DIFFICULTY': {
      // Change difficulty level, reset question queues, get new question for current player
      const { filtered, kidsFiltered } = getFilteredQuestions(action.level)
      const shuffledQuestions = shuffle([...filtered])
      const shuffledKidsQuestions = shuffle([...kidsFiltered])

      const currentPlayer = state.players[state.currentPlayerIndex]
      let firstQuestion: Question
      let restQuestions: Question[]
      let restKidsQuestions: Question[]

      if (currentPlayer.isChild && shuffledKidsQuestions.length > 0) {
        [firstQuestion, ...restKidsQuestions] = shuffledKidsQuestions
        restQuestions = shuffledQuestions
      } else if (shuffledQuestions.length > 0) {
        [firstQuestion, ...restQuestions] = shuffledQuestions
        restKidsQuestions = shuffledKidsQuestions
      } else {
        // Fallback: use all questions if no questions for this difficulty
        const allShuffled = shuffle([...allQuestions])
        const allKidsShuffled = shuffle([...allQuestions.filter(q => q.forKids)])
        if (currentPlayer.isChild && allKidsShuffled.length > 0) {
          [firstQuestion, ...restKidsQuestions] = allKidsShuffled
          restQuestions = allShuffled
        } else {
          [firstQuestion, ...restQuestions] = allShuffled
          restKidsQuestions = allKidsShuffled
        }
      }

      return {
        ...state,
        difficultyLevel: action.level,
        questionsQueue: restQuestions,
        kidsQuestionsQueue: restKidsQuestions,
        currentQuestion: firstQuestion,
        phase: 'waiting'
      }
    }

    default:
      return state
  }
}

function createInitialState(players: Player[], boardLength: number, difficultyLevel: DifficultyLevel): GameState {
  const { filtered, kidsFiltered } = getFilteredQuestions(difficultyLevel)
  const shuffledQuestions = shuffle([...filtered])
  const shuffledKidsQuestions = shuffle([...kidsFiltered])

  // First player determines which queue to use for first question
  const firstPlayer = players[0]
  let firstQuestion: Question
  let restQuestions: Question[]
  let restKidsQuestions: Question[]

  if (firstPlayer.isChild && shuffledKidsQuestions.length > 0) {
    [firstQuestion, ...restKidsQuestions] = shuffledKidsQuestions
    restQuestions = shuffledQuestions
  } else if (shuffledQuestions.length > 0) {
    [firstQuestion, ...restQuestions] = shuffledQuestions
    restKidsQuestions = shuffledKidsQuestions
  } else {
    // Fallback: use all questions if no questions for this difficulty
    const allShuffled = shuffle([...allQuestions])
    const allKidsShuffled = shuffle([...allQuestions.filter(q => q.forKids)])
    if (firstPlayer.isChild && allKidsShuffled.length > 0) {
      [firstQuestion, ...restKidsQuestions] = allKidsShuffled
      restQuestions = allShuffled
    } else {
      [firstQuestion, ...restQuestions] = allShuffled
      restKidsQuestions = allKidsShuffled
    }
  }

  const initialStats: Record<string, PlayerStats> = {}
  players.forEach(p => {
    initialStats[p.name] = { correct: 0, wrong: 0, skipped: 0 }
  })

  return {
    players: players.map(p => ({ ...p, position: 0 })),
    currentPlayerIndex: 0,
    board: generateBoard(boardLength, getEnableSpecialCells()),
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
    playerStats: initialStats,
    difficultyLevel
  }
}

export function useGameState(players: Player[], boardLength: number, difficultyLevel: DifficultyLevel = 'medium') {
  const [state, dispatch] = useReducer(
    gameReducer,
    { players, boardLength, difficultyLevel },
    ({ players, boardLength, difficultyLevel }) => createInitialState(players, boardLength, difficultyLevel)
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
  const changeDifficulty = useCallback((level: DifficultyLevel) => dispatch({ type: 'CHANGE_DIFFICULTY', level }), [])

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
    updatePlayers,
    changeDifficulty
  }
}
