export function forEach<T, G>(items: T[], onItem: (item: T, cb: (err: Error | null, item?: G) => void) => void, cb: (err: Error | null, result?: G[]) => void) {
  let i = 0
  const result: G[] = []
  
  const next = () => {
    if (i === items.length) {
      return cb(null, result)
    }
    onItem(items[i++], (err, item) => {
      if (err) {
        return cb(err)
      }
      result.push(item!)
      next()
    })
  }

  next()
}
