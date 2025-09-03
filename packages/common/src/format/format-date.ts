const pad2 = v => ('' + v).padStart(2, '0')

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatDate = (format, date) => {
  if (!date) {
    return 'Unkown'
  }
  const d = new Date(date)
  return format.replace(/%([dmbyYHMS])/g, (_, code) => {
    switch (code) {
      case 'Y': return '' + d.getFullYear()
      case 'y': return ('' + d.getFullYear()).substring(2, 4)
      case 'm': return pad2(d.getMonth() + 1)
      case 'b': return shortMonths[d.getMonth()]
      case 'd': return pad2(d.getDate())
      case 'H': return pad2(d.getHours())
      case 'M': return pad2(d.getMinutes())
      case 'S': return pad2(d.getSeconds())
      default: return ''
    }
  })
}
