const rateLimit = (fn, interval) => {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last < interval) {
      return
    }
    last = now
    return fn(...args)
  }
}

module.exports = rateLimit