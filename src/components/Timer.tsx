/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react'
import './Timer.css'

interface Props {
  duration: number
  isRunning: boolean
  onComplete: () => void
}

export default function Timer({ duration, isRunning, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(duration)
  const onCompleteRef = useRef(onComplete)
  const wasRunningRef = useRef(isRunning)
  const hasCompletedRef = useRef(false)

  // Update the callback ref in an effect
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Handle timer start/reset and countdown
  useEffect(() => {
    // Detect transition from not running to running
    if (isRunning && !wasRunningRef.current) {
      setTimeLeft(duration)
      hasCompletedRef.current = false
    }
    wasRunningRef.current = isRunning

    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(interval)
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true
            // Use setTimeout to avoid calling during render
            setTimeout(() => onCompleteRef.current(), 0)
          }
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, duration])

  const progress = timeLeft / duration
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference * (1 - progress)

  const getColor = () => {
    if (timeLeft <= 1) return '#e74c3c' // red
    if (timeLeft <= 2) return '#f39c12' // orange
    return '#2ecc71' // green
  }

  const shouldPulse = isRunning && timeLeft <= 2 && timeLeft > 0

  return (
    <div className={`timer ${shouldPulse ? 'pulse' : ''}`}>
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
