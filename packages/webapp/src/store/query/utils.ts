export const uniqBy = (keyFn) => {
  const seen = {}
  return v => {
    const key = keyFn(v)
    if (!seen[key]) {
      seen[key] = true
      return true
    }
    return false
  }
}

export const byValueFn = (valueFn, asc = true) => {
  const cmp = asc ? -1 : 1
  return (a, b) => valueFn(a) < valueFn(b) ? cmp : -cmp
}

export const byDateDesc = byValueFn(e => e.date, false)
