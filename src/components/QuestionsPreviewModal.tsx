import type { Question, DifficultyLevel } from '../types'
import { DIFFICULTY_RANGES } from '../types'
import './QuestionsPreviewModal.css'

interface Props {
  questions: Question[]
  difficultyLevel: DifficultyLevel
  onClose: () => void
}

export default function QuestionsPreviewModal({ questions, difficultyLevel, onClose }: Props) {
  const { label } = DIFFICULTY_RANGES[difficultyLevel]

  return (
    <div className="questions-modal-overlay" onClick={onClose}>
      <div className="questions-modal" onClick={e => e.stopPropagation()}>
        <div className="questions-modal-header">
          <h2 className="questions-modal-title">
            Питання: {label}
          </h2>
          <span className="questions-modal-count">
            {questions.length} питань
          </span>
        </div>

        <div className="questions-modal-list">
          {questions.map((q, index) => (
            <div key={q.id} className="questions-modal-item">
              <span className="questions-modal-num">{index + 1}.</span>
              <span className="questions-modal-text">{q.text}</span>
              <span className="questions-modal-difficulty">{q.difficulty}</span>
            </div>
          ))}
        </div>

        <button className="questions-modal-close" onClick={onClose}>
          Закрити
        </button>
      </div>
    </div>
  )
}
