import { useEffect, useState } from 'react'
import './Timer.css'

interface Props {
  duration: 5 | 3
  isRunning: boolean
  onComplete: () => void
}

export default function Timer({ duration, isRunning, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setTimeLeft(duration)
  }, [duration, isRunning])

  useEffect(() => {
    if (!isRunning) return

    if (timeLeft <= 0) {
      onComplete()
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, onComplete])

  const progress = timeLeft / duration
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference * (1 - progress)

  const getColor = () => {
    if (timeLeft <= 1) return '#e74c3c' // red
    if (timeLeft <= 2) return '#f39c12' // orange
    return '#2ecc71' // green
  }

  return (
    <div className={`timer ${timeLeft <= 2 ? 'pulse' : ''}`}>
      <svg viewBox="0 0 100 100">
        <circle
          className="timer-bg"
          cx="50"
          cy="50"
          r="45"
        />
        <circle
          className="timer-progress"
          cx="50"
          cy="50"
          r="45"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            stroke: getColor()
          }}
        />
      </svg>
      <div className="timer-text" style={{ color: getColor() }}>
        {timeLeft}
      </div>
    </div>
  )
}
