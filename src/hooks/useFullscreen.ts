import { useState, useEffect, useCallback } from 'react'

// Check if Fullscreen API is supported (can be done synchronously at module level)
const checkFullscreenSupport = () => {
  if (typeof document === 'undefined') return false
  return (
    document.fullscreenEnabled ||
    // @ts-expect-error - webkit prefix for Safari
    document.webkitFullscreenEnabled ||
    false
  )
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isSupported = checkFullscreenSupport()

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement ||
        // @ts-expect-error - webkit prefix for Safari
        !!document.webkitFullscreenElement
      )
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    // Check initial state
    handleFullscreenChange()

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (!isSupported) return

    try {
      if (!document.fullscreenElement &&
          // @ts-expect-error - webkit prefix for Safari
          !document.webkitFullscreenElement) {
        // Enter fullscreen
        const docEl = document.documentElement
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen()
        // @ts-expect-error - webkit prefix for Safari
        } else if (docEl.webkitRequestFullscreen) {
          // @ts-expect-error - webkit prefix for Safari
          await docEl.webkitRequestFullscreen()
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        // @ts-expect-error - webkit prefix for Safari
        } else if (document.webkitExitFullscreen) {
          // @ts-expect-error - webkit prefix for Safari
          await document.webkitExitFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }, [isSupported])

  return { isFullscreen, isSupported, toggleFullscreen }
}
