import { useState, useCallback, useMemo, useEffect, RefObject } from 'react';

const delayFrame = fn => {
  let isTriggered = false
  let lastArgs

  return (...args) => {
    lastArgs = args
    if (!isTriggered) {
      window.requestAnimationFrame(() => {
        isTriggered = false
        fn(...lastArgs)
      })
      isTriggered = true
    }
  }
}

const delayEvent = (fn, preventDefault = false) => {
  const delay = delayFrame(fn)
  return e => {
    if (preventDefault && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
    delay(e)
  }
}

type Position = {
  x: number
  y: number
}

export type Dragging = {
  isDragging: boolean
  start: Position
  current: Position
}

const createDraggingState = () => ({
  isDragging: false,
  start: { x: 0, y: 0 },
  current: { x: 0, y: 0 }
})

const getFirstTouch = (e, id) => [...e.changedTouches].find(touch => touch?.identifier === id)
const getTouchPos = touch => ({x: touch.clientX, y: touch.clientY})

export const useTouchDragging = (ref: RefObject<any>): Dragging => {
  const [dragging, setDragging] = useState(createDraggingState())

  const state = useMemo(() => ({isPressing: false, firstTouchId: false, lastPos: {x: -1, y: -1}}), [])

  const handleTouchStart = useCallback(e => {
    if (state.firstTouchId === false) {
      state.isPressing = true
      const firstTouch = e.changedTouches[0]
      state.firstTouchId = firstTouch.identifier
      const pos = getTouchPos(firstTouch)
      state.lastPos = pos
      setDragging(dragging => ({...dragging, start: pos, current: pos}))
    }
  }, [])

  const handleTouchEnd = useCallback(e => {
    const touch = getFirstTouch(e, state.firstTouchId)
    if (!state.isPressing || !touch) {
      return
    }
    state.isPressing = false
    state.firstTouchId = false
    setDragging(dragging => ({...dragging, isDragging: false}))
  }, [])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    // Sometimes y coordinate jumps on Safari at iOS
    const dropInvalidIOsTouchMove = (lastPos, pos) => Math.abs(lastPos.y - pos.y) > 50

    const delayTouchPos = delayFrame((pos) => {
      if (!state.isPressing) {
        return
      }
      setDragging(dragging => {
        return {...dragging, isDragging: true, current: pos}
      })
    })

    const handleTouchMove = e => {
      const touch = getFirstTouch(e, state.firstTouchId)
      if (!state.isPressing || !touch) {
        return
      }
      const pos = getTouchPos(touch)
      e.preventDefault()
      e.stopPropagation()

      if (dropInvalidIOsTouchMove(state.lastPos, pos)) {
        return false
      }
      state.lastPos = pos
      delayTouchPos(pos)
      return false
    }

    const element = ref.current
    const rootElement = document.documentElement

    element.addEventListener('touchstart', handleTouchStart)
    rootElement.addEventListener('touchmove', handleTouchMove, { passive: false })
    rootElement.addEventListener('touchcancel', handleTouchEnd)
    rootElement.addEventListener('touchend', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      rootElement.removeEventListener('touchmove', handleTouchMove)
      rootElement.removeEventListener('touchcancel', handleTouchEnd)
      rootElement.removeEventListener('touchend', handleTouchEnd)
    }
  }, [ref])

  return dragging
}

export const useMouseDragging = (ref: RefObject<any>): Dragging => {
  const [dragging, setMouseDragging] = useState(createDraggingState())

  const state = useMemo(() => ({isPressing: false, start: false}), [])

  const getMousePos = e => ({x: e.clientX, y: e.clientY})

  const handleMouseDown = useCallback(e => {
    state.isPressing = true
    const pos = getMousePos(e)
    setMouseDragging(dragging => ({...dragging, start: pos, current: pos}))
  }, [])

  const handleMouseMove = useCallback(delayEvent(e => {
    if (!state.isPressing) {
      return
    }
    setMouseDragging(dragging => ({...dragging, isDragging: true, current: getMousePos(e)}))
  }, true), [])

  const handleMouseUp = useCallback(e => {
    if (!state.isPressing) {
      return
    }
    state.isPressing = false
    setMouseDragging(dragging => ({...dragging, isDragging: false}))
  }, [])

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const element = ref.current
    const rootElement = document.documentElement

    element.addEventListener('mousedown', handleMouseDown)
    rootElement.addEventListener('mousemove', handleMouseMove, { passive: false })
    rootElement.addEventListener('mouseup', handleMouseUp)

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      rootElement.removeEventListener('mousemove', handleMouseMove)
      rootElement.removeEventListener('mouseup', handleMouseUp)
    }
  }, [ref])

  return dragging
}