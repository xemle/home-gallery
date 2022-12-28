import { useState, useEffect } from 'react'
import { throttle } from './throttle'

const isEqual = (prev, cur) => ['top', 'left', 'width', 'height'].findIndex(prop => prev && cur && prev[prop] != cur[prop]) < 0

export const useClientRect = (ref, pollingMs = 0) => {
  const getRect = e => e?.getBoundingClientRect()

  const [rect, setRect] = useState(getRect(ref.current))

  const updateRect = () => {
    setRect(prev => {
      const cur = getRect(ref.current)
      return prev && isEqual(prev, cur) ? prev : cur
    })
  }

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const element = ref.current
    const observer = new ResizeObserver(updateRect)
    observer.observe(element)
    return () => {
      observer.unobserve(element)
    }
  }, [ref])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const throttledUpdate = throttle(updateRect, 1000 / 60)

    window.addEventListener('resize', throttledUpdate)
    return () => window.removeEventListener('resize', throttledUpdate)
  }, [])

  useEffect(() => {
    if (pollingMs <= 0) {
      return
    }

    const id = setInterval(updateRect, pollingMs)

    return () => clearInterval(id)
  }, [])

  return rect
}