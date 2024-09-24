export const forEach = (items, onItem, cb) => {
  let i = 0
  const result = []
  
  const next = () => {
    if (i === items.length) {
      return cb(null, result)
    }
    onItem(items[i++], (err, ...rest) => {
      if (err) {
        return cb(err)
      }
      result.push(rest)
      next()
    })
  }

  next()
}
