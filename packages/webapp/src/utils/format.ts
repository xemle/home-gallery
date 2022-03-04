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

export const formatDate = (format, date) => {
  if (!date) {
    return 'Unkown'
  }
  const d = new Date(date);
  return format.replace(/%([dmYHMS])/g, (_, code) => {
    if (code === 'Y') return '' + d.getFullYear()
    if (code === 'm') return pad2(d.getMonth() + 1)
    if (code === 'd') return pad2(d.getDate())
    if (code === 'H') return pad2(d.getHours())
    if (code === 'M') return pad2(d.getMinutes())
    if (code === 'S') return pad2(d.getSeconds())
    return '';
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