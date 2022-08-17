const toLower = v => typeof v == 'string' ? v.toLowerCase() : '' + v

const getDateByKey = (date, key) => {
  switch (key) {
    case 'year':
    case 'y':
      return +date.slice(0, 4)
    case 'month':
    case 'm':
      return +date.slice(5, 7)
    case 'day':
    case 'd':
      return +date.slice(8, 10)
    case 'hour':
    case 'H':
      return +date.slice(11, 13)
    case 'minute':
    case 'M':
      return +date.slice(14, 16)
  }
}

const matchNumber = v => v.match(/^\d+$/)

const matchFloat = v => v.match(/^-?\d+(\.\d+)?$/)

const matchDate = v => v.match(/^\d{4}(-\d{2}(-\d{2})?)?$/)

const basename = file => {
  const pos = file.lastIndexOf('/')
  return pos >= 0 ? file.substring(pos + 1) : file
}

const dirname = file => {
  const pos = file.lastIndexOf('/')
  return pos >= 0 ? file.substring(0, pos) : ''
}

const ext = file => {
  const pos = file.lastIndexOf('.')
  return pos >= 0 ? file.substring(pos + 1) : file
}

module.exports = {
  toLower,
  getDateByKey,
  matchNumber,
  matchFloat,
  matchDate,
  basename,
  dirname,
  ext
}
