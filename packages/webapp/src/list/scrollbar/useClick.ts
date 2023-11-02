import { useEffect, RefObject, useRef } from 'react';

export const useClick = (ref: RefObject<any>, onClick: Function) => {
  const lastMouseDown = useRef(0)

  const handleMouseDown = () => lastMouseDown.current = Date.now()

  const handleMouseUp = (e) => {
    const diff = Date.now() - lastMouseDown.current
    if (diff < 300) {
      onClick(e)
    }
  }

  useEffect(() => {
    if (!ref.current) {
      return
    }

    const element = ref.current
    const rootElement = document.documentElement

    element.addEventListener('mousedown', handleMouseDown)
    rootElement.addEventListener('mouseup', handleMouseUp)

    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      rootElement.removeEventListener('mouseup', handleMouseUp)
    }
  }, [ref])

}