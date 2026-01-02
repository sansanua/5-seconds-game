// src/hooks/useGameState.ts
import { useReducer, useCallback } from 'react'
import type { GameState, Player, Question } from '../types'
import { generateBoard, shuffle } from '../utils/game'
import { questions as allQuestions } from '../data/questions'

type GameAction =
  | { type: 'START_TIMER' }
  | { type: 'TIMER_END' }
  | { type: 'ANSWER_CORRECT' }
  | { type: 'ANSWER_WRONG' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SKIP_QUESTION' }

function getNextPlayerIndex(state: GameState): number {
  let next = (state.currentPlayerIndex + 1) % state.players.length
  // Skip players in skipNextTurn
  while (state.skipNextTurn.includes(next)) {
    next = (next + 1) % state.players.length
  }
  return next
}

function getNextQuestion(state: GameState): { question: Question; queue: Question[] } {
  let queue = state.questionsQueue
  if (queue.length === 0) {
    queue = shuffle([...allQuestions])
  }
  const [question, ...rest] = queue
  return { question, queue: rest }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_TIMER': {
      const currentCell = state.board[state.players[state.currentPlayerIndex].position]
      const isFast = currentCell.type === 'special' && currentCell.specialType === 'fast'
      const isDouble = currentCell.type === 'special' && currentCell.specialType === 'double'

      return {
        ...state,
        phase: 'timer',
        timerDuration: isFast ? 3 : 5,
        doubleQuestion: isDouble
      }
    }

    case 'TIMER_END':
      return { ...state, phase: 'judging' }

    case 'ANSWER_CORRECT': {
      const currentPlayer = state.players[state.currentPlayerIndex]
      const currentCell = state.board[currentPlayer.position]

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
            // Swap with random other player
            const otherPlayers = state.players.filter((_, i) => i !== state.currentPlayerIndex)
            if (otherPlayers.length > 0) {
              const randomOther = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
              const otherIndex = state.players.findIndex(p => p.name === randomOther.name)
              const newPlayers = [...state.players]
              const tempPos = newPlayers[state.currentPlayerIndex].position
              newPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: randomOther.position }
              newPlayers[otherIndex] = { ...randomOther, position: tempPos }

              // Check for winner after swap
              const winner = newPlayers.find(p => p.position >= state.board.length - 1)

              return {
                ...state,
                players: newPlayers,
                phase: winner ? 'effect' : 'waiting',
                winner: winner || null,
                currentPlayerIndex: winner ? state.currentPlayerIndex : getNextPlayerIndex(state),
                currentQuestion: winner ? state.currentQuestion : getNextQuestion(state).question,
                questionsQueue: winner ? state.questionsQueue : getNextQuestion(state).queue
              }
            }
            break
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
      const { question, queue } = getNextQuestion(state)

      return {
        ...state,
        players: newPlayers,
        phase: winner ? 'effect' : 'waiting',
        winner,
        skipNextTurn: newSkipList,
        currentPlayerIndex: winner ? state.currentPlayerIndex : getNextPlayerIndex({ ...state, skipNextTurn: newSkipList }),
        currentQuestion: winner ? state.currentQuestion : question,
        questionsQueue: winner ? state.questionsQueue : queue,
        doubleQuestion: false
      }
    }

    case 'ANSWER_WRONG': {
      const { question, queue } = getNextQuestion(state)
      const newSkipList = state.skipNextTurn.filter(i => i !== state.currentPlayerIndex)

      return {
        ...state,
        phase: 'waiting',
        currentPlayerIndex: getNextPlayerIndex({ ...state, skipNextTurn: newSkipList }),
        currentQuestion: question,
        questionsQueue: queue,
        skipNextTurn: newSkipList,
        doubleQuestion: false
      }
    }

    case 'NEXT_QUESTION': {
      const { question, queue } = getNextQuestion(state)
      return {
        ...state,
        currentQuestion: question,
        questionsQueue: queue
      }
    }

    case 'SKIP_QUESTION': {
      // Skip question without penalty - just get next question for same player
      const { question, queue } = getNextQuestion(state)
      return {
        ...state,
        currentQuestion: question,
        questionsQueue: queue,
        phase: 'waiting'
      }
    }

    default:
      return state
  }
}

function createInitialState(players: Player[], boardLength: number): GameState {
  const shuffledQuestions = shuffle([...allQuestions])
  const [firstQuestion, ...restQuestions] = shuffledQuestions

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
    winner: null
  }
}

export function useGameState(players: Player[], boardLength: number) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { players, boardLength },
    ({ players, boardLength }) => createInitialState(players, boardLength)
  )

  const startTimer = useCallback(() => dispatch({ type: 'START_TIMER' }), [])
  const timerEnd = useCallback(() => dispatch({ type: 'TIMER_END' }), [])
  const answerCorrect = useCallback(() => dispatch({ type: 'ANSWER_CORRECT' }), [])
  const answerWrong = useCallback(() => dispatch({ type: 'ANSWER_WRONG' }), [])
  const skipQuestion = useCallback(() => dispatch({ type: 'SKIP_QUESTION' }), [])

  return {
    state,
    startTimer,
    timerEnd,
    answerCorrect,
    answerWrong,
    skipQuestion
  }
}
