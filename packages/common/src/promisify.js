const promisify = fn => (...args) => {
  return new Promise((resolve, reject) => {
    fn(...args, (err, ...result) => {
      err ? reject(err) : resolve(result.length > 1 ? result : result[0])
    })
  })
}

module.exports = promisify
