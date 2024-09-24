export const debounce = (fn, waitMs = 1000) => {
  let timerId
  return (...args) => {
    if (timerId) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => fn(...args), waitMs)
  }
}
