const callbackify = (fn, resultAsArray) => (...args) => {
  const cb = args.pop()
  fn(...args)
    .then(result => resultAsArray || !Array.isArray(result) ? cb(null, result) : cb(null, ...result))
    .catch(err => cb && cb(err))
}

module.exports = callbackify
