import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { throttle } from './throttle'

const hasReizeObserver = typeof ResizeObserver === 'function'
const defaultRect: DOMRect = new DOMRect(0, 0, window?.innerWidth || 0, window?.innerHeight || 0)

export const useClientRect = (ref: React.RefObject<HTMLElement | null>, pollingMs = 0) => {
  const [rect, setRect] = useState<DOMRect | null>(getRect(ref.current) || defaultRect)

  const updateRect = useCallback(() => {
    if (!ref.current) {
      return
    }

    setRect(prev => {
      const cur = getRect(ref.current)
      return prev && isEqual(prev, cur) ? prev : cur
    })
  }, [])

  useLayoutEffect(() => {
    if (!ref.current) {
      return
    }
    updateRect()

    if (hasReizeObserver) {
      const element = ref.current
      const observer = new ResizeObserver(updateRect)
      observer.observe(element)

      return () => {
        observer.unobserve(element)
      }
    }

    // missing ResizeObserver fallback
    const throttledUpdate = throttle(updateRect, 1000 / 60)
    window.addEventListener('resize', throttledUpdate)
    return () => {
      window.removeEventListener('resize', throttledUpdate)
    }
  }, [ref])

  useEffect(() => {
    if (pollingMs <= 0) {
      return
    }

    const id = setInterval(updateRect, pollingMs)

    return () => clearInterval(id)
  }, [])

  return rect
}

function isEqual(prev: DOMRect, cur: DOMRect | null) {
  if (!prev || !cur) {
    return false
  }

  return prev.x == cur.x && prev.y == cur.y &&
    prev.width == cur.width && prev.height == cur.height
}

function getRect(e: HTMLElement | null) {
  if (!e) {
    return null
  }
  return e.getBoundingClientRect()
}
