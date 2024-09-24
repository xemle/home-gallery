export const toLower = v => typeof v == 'string' ? v.toLowerCase() : '' + v

export const getDateByKey = (date, key) => {
  switch (key) {
    case 'year':
      return +date.slice(0, 4)
    case 'month':
      return +date.slice(5, 7)
    case 'day':
      return +date.slice(8, 10)
    case 'hour':
      return +date.slice(11, 13)
    case 'minute':
      return +date.slice(14, 16)
  }
}

export const matchNumber = v => v.match(/^\d+$/)

export const matchFloat = v => v.match(/^-?\d+(\.\d+)?$/)

export const matchDate = v => v.match(/^\d{4}(-\d{2}(-\d{2})?)?$/)

export const basename = file => {
  const pos = file.lastIndexOf('/')
  return pos >= 0 ? file.substring(pos + 1) : file
}

export const dirname = file => {
  const pos = file.lastIndexOf('/')
  return pos >= 0 ? file.substring(0, pos) : ''
}

export const ext = file => {
  const pos = file.lastIndexOf('.')
  return pos >= 0 ? file.substring(pos + 1) : file
}
