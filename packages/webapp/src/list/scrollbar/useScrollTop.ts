import { useState, useEffect } from "react"

export const useScrollTop = (ref) => {
  const [scrollTop, setScrollTop] = useState(0)

  let isScrolling = false
  let lastScrollTop = 0

  const onScroll = () => {
    lastScrollTop = ref.current?.scrollTop || ref.current?.scrollY
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        setScrollTop(lastScrollTop)
        isScrolling = false
      })
      isScrolling = true
    }
  }

  useEffect(() => {
    const container = ref.current
    if (!container) {
      return
    }

    container.addEventListener('scroll', onScroll)
    return () => container.removeEventListener('scroll', onScroll)
  }, [ref])

  return scrollTop
}
