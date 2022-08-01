import { useRef, useState, useEffect } from 'react'

export const useClientRect = ref => {
  const getRect = e => e?.getBoundingClientRect()

  const [rect, setRect] = useState(getRect(ref.current))

  const handleObserve = () => setRect(getRect(ref.current))

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const observer = new ResizeObserver(handleObserve)
    observer.observe(ref.current)
    return () => {
      observer.unobserve(ref.current)
    }
  }, [ref])

  return rect
}

export const useClientHeight = ref => {
  const rect = useClientRect(ref)

  const [height, setHeight] = useState(rect?.height || 0)

  useEffect(() => setHeight(rect?.height || 0), [rect])

  return height
}