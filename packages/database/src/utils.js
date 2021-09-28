const entryToString = entry => `${entry.id.slice(0, 7)}`

const fileToString = file => `${file.id.slice(0, 7)}:${file.index}:${file.filename}`

const toMultiKeyMap = (values, keysFn) => values.reduce((result, value) => {
  const keys = keysFn(value)
  if (!keys) {
    return result
  } else if (Array.isArray(keys)) {
    keys.forEach(key => {
      result[key] = value
    })
  } else {
    result[keys] = value
  }
  return result
}, {})

const toMultiValueMap = (entries, initialValue = {}, keyFn = e => e.id) => {
  entries.forEach(entry => {
    const key = keyFn(entry)
    if (initialValue[key]) {
      initialValue[key].push(entry)
    } else {
      initialValue[key] = [entry]
    }
  })
  return initialValue
}

const uniqBy = fn => {
  const keys = []

  return value => {
    const key = fn(value)
    if (keys.includes(key)) {
      return false
    }
    keys.push(key)
    return true
  }
}

module.exports = {
  entryToString,
  fileToString,
  toMultiKeyMap,
  toMultiValueMap,
  uniqBy
}