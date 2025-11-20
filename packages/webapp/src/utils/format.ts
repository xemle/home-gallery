export const humanizeDuration = duration => {
  const hours = duration / 3600
  const min = '' + Math.floor((duration % 3600) / 60)
  const sec = (duration % 60).toFixed()
  if (hours > 1) {
    return `${Math.floor(hours)}:${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
  }
  return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
}

const pad2 = (v : number | string) => ('' + v).padStart(2, '0')

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const formatDate = (format, date) => {
  if (!date) {
    return 'Unkown'
  }
  const d = new Date(date)
  return format.replace(/%([YymbdHIPpMSaA])/g, (_, code) => {
    switch (code) {
      case 'Y': return '' + d.getFullYear()
      case 'y': return ('' + d.getFullYear()).substring(2, 4)
      case 'm': return pad2(d.getMonth() + 1)
      case 'b': return shortMonths[d.getMonth()]
      case 'd': return pad2(d.getDate())
      case 'H': return pad2(d.getHours())
      case 'I': return pad2(d.getHours() > 12 ? d.getHours() - 12 : d.getHours())
      case 'P': return pad2(d.getHours() >= 12 ? 'pm' : 'am')
      case 'p': return pad2(d.getHours() >= 12 ? 'PM' : 'AM')
      case 'M': return pad2(d.getMinutes())
      case 'S': return pad2(d.getSeconds())
      case 'a': return shortWeekDays[d.getDay()]
      case 'A': return weekDays[d.getDay()]
      default: return ''
    }
  })
}

export const humanizeBytes = bytes => {
  const units = ['', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  while (bytes > 786 && unitIndex < units.length - 1) {
    unitIndex++
    bytes /= 1024
  }
  return `${bytes.toFixed(1)}${units[unitIndex]}`
}