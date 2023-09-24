const convertExcludes = (excludes, target = {}) => {
  if (Array.isArray(excludes)) {
    excludes.map(e => convertExcludes(e, target))
    return target
  } else if (typeof excludes == 'string') {
    const parts = excludes.split('.')
    let sub = target
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof sub[parts[i]] != 'object') {
        sub[parts[i]] = {}
      }
      sub = sub[parts[i]]
    }
    sub[parts[parts.length - 1]] = true
    return target
  }
  return target
}

const serialize = (o, excludes = {}) => {
  if (typeof o == 'undefined' || o === null) {
    return 'null'
  } else if (Array.isArray(o)) {
    return `[${o.map(e => serialize(e, excludes)).join(',')}]`
  } else if (typeof o == 'object') {
    excludes = typeof excludes == 'string' || Array.isArray(excludes) ? convertExcludes(excludes) : excludes
    const entries = Object.entries(o).filter(([name]) => excludes[name] !== true).sort(([a], [b]) => a <= b ? -1 : 0)
    const s = ['{']
    for (let i = 0; i < entries.length; i++) {
      const name = entries[i][0]
      s.push('"', name, '":', serialize(entries[i][1], excludes[name] || {}), i < entries.length - 1 ? ',' : '')
    }
    s.push('}')
    return s.join('')
  } else {
    return JSON.stringify(o)
  }
}

module.exports = serialize
