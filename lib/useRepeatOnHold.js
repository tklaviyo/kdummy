'use client'

import { useRef, useCallback } from 'react'

const DEFAULT_DELAY = 400
const DEFAULT_INTERVAL = 100

/**
 * Returns handlers for a button that runs callback once on press, then repeats after delay while held.
 * Use on increment/decrement buttons so holding the button keeps changing the value.
 */
export function useRepeatOnHold(callback, options = {}) {
  const { delay = DEFAULT_DELAY, interval = DEFAULT_INTERVAL } = options
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)
  const cleanupRef = useRef(null)

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    callback()
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      intervalRef.current = setInterval(callback, interval)
    }, delay)
    cleanupRef.current = () => {
      document.removeEventListener('mouseup', stop)
      document.removeEventListener('mouseleave', stop)
      document.removeEventListener('touchend', stop)
      document.removeEventListener('touchcancel', stop)
    }
    document.addEventListener('mouseup', stop)
    document.addEventListener('mouseleave', stop)
    document.addEventListener('touchend', stop)
    document.addEventListener('touchcancel', stop)
  }, [callback, delay, interval, stop])

  return {
    onMouseDown: (e) => {
      e.preventDefault()
      start()
    },
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: (e) => {
      e.preventDefault()
      start()
    },
    onTouchEnd: stop,
  }
}
