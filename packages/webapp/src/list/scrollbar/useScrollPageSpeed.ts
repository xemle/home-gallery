import { useRef, useState, useReducer, useEffect, Dispatch } from 'react'

// credits https://overreacted.io/making-setinterval-declarative-with-react-hooks/
const useInterval = (callback: Function, delay: number) => {
  const savedCallback = useRef(callback)

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      savedCallback.current()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

const getScrollTop = e => +(e?.scrollTop || e?.scrollY || 0).toFixed()

const diffMap = (offset = 0) => {
  return (_, i, a) => {
    const current = a[(i + offset) % a.length]
    const prev = a[(i + offset - 1 + a.length) % a.length]

    return Math.abs(current - prev)
  }
}

const flattenMap = (size, offset = 0) => {
  return (_, i, a) => {
    let sum = 0
    for (let j = 0; j < size; j++) {
      sum += a[(i - j + offset + a.length) % a.length]
    }
    return +(sum / size).toFixed()
  }
}

const scrollPageSpeedInit = (ref, pageHeight, intervalMs, count) => ({
  ref,
  pageHeight,
  pagePerSecond: 0,
  count,
  intervalMs,
  timeFactor: 1000 / intervalMs,
  scrollTops: new Array(count).fill(0),
  flattenSize: 3,
  index: 0
})

const reducer = (state, action) => {
  if (action.type == 'tick') {
    const { ref, pageHeight, count, timeFactor, scrollTops, flattenSize, index } = state

    const scrollTop = getScrollTop(ref.current)
    scrollTops[index % count] = scrollTop

    const flattenDiffs = scrollTops
      .map(flattenMap(flattenSize, index)) // flatten scroll jittering with reindex
      .map(diffMap())                      // create scroll diffs
      .slice(0, count - flattenSize - 1)   // remove invalid values from flatten and diff
    const sumFlattenDiffs = flattenDiffs.reduce((r, v) => r + v, 0)

    const pagePerSecond = sumFlattenDiffs * timeFactor / flattenDiffs.length / pageHeight
    return {
      ...state,
      pagePerSecond: pagePerSecond,
      index: index + 1
    }
  } else if (action.type == 'pageHeight') {
    return {...state, pageHeight: action.pageHeight}
  }
  return state
}

export const useScrollPageSpeed = (ref, pageHeight): [number, Dispatch<number>] => {
  const [state, dispatch] = useReducer(reducer, scrollPageSpeedInit(ref, pageHeight, 200, 10))

  const setPageHeight = pageHeight => dispatch({type: 'pageHeight', pageHeight})

  useInterval(() => dispatch({type: 'tick'}), state.intervalMs)
  useEffect(() => setPageHeight(pageHeight), [pageHeight])

  return [state.pagePerSecond, setPageHeight]
}

export enum SimplePageSpeed {
  NONE,
  SLOW,
  MEDIUM,
  FAST
}

const toSimpleSpeed = pagePerSecond => {
  if (pagePerSecond == 0) {
    return SimplePageSpeed.NONE
  } else if (pagePerSecond < 0.6) {
    return SimplePageSpeed.SLOW
  } else if (pagePerSecond < 1.5) {
    return SimplePageSpeed.MEDIUM
  } else {
    return SimplePageSpeed.FAST
  }
}

export const useScrollPageSpeedSimple = (ref, pageHeight): [SimplePageSpeed, Dispatch<number>] => {
  const [pagePerSecond, setPageHeight] = useScrollPageSpeed(ref, pageHeight)
  const [simpleSpeed, setSimpleSpeed] = useState(toSimpleSpeed(pagePerSecond))

  useEffect(() => setSimpleSpeed(() => toSimpleSpeed(pagePerSecond)), [pagePerSecond])

  return [simpleSpeed, setPageHeight]
}