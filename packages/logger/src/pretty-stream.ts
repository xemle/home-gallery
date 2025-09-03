import pretty from 'pino-pretty'

import { colorFns } from './utils/colors.js'

const levels = {
  '10': 'trace',
  '20': 'debug',
  '30': 'info',
  '40': 'warn',
  '50': 'error',
  '60': 'fatal',
}

const isNumber = v => typeof v == 'number'

const pad = (v, l, c = '0') => {
  v = '' + v
  l = l || 1
  c = c || '0'
  while (v.length < l) {
    v = '0' + v
  }
  return v
}

const humanizeDuration = duration => {
  if (duration < 800) {
    return duration.toFixed() + 'ms'
  } else if (duration < 3000) {
    return (duration / 1000).toFixed(2) + 's'
  } else if (duration < 20 * 1000) {
    return (duration / 1000).toFixed(1) + 's'
  } else if (duration < 60 * 1000) {
    return (duration / 1000).toFixed() + 's'
  } else if (duration < 60 * 60 * 1000) {
    const sec = +(duration / 1000).toFixed() % 60
    const min = (duration / 1000 / 60).toFixed()
    return `${pad(min, 2)}:${pad(sec, 2)}`
  } else {
    const sec = +(duration / 1000).toFixed() % 60
    const min = +(duration / 1000 / 60).toFixed() % 60
    const hours = (duration / 1000 / 60 / 60).toFixed()
    return `${hours}:${pad(min, 2)}:${pad(sec, 2)}`
  }
}

const createStream = () => {
  return pretty({
    colorize: false,
    ignore: 'hostname,pid,level',
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
    hideObject: true,
    messageFormat: (log, messageKey) => {
      const msg = log[messageKey]
      const level = levels[log.level as string] || levels['30']

      return [
        log.module ? colorFns.moduleColorFn(log.module)(log.module) + ' ' : '',
        level != 'info' ? colorFns[level].levelColorFn(level) + ' ' : '',
        colorFns[level].msgColorFn(msg),
        isNumber(log.duration) ? colorFns.durationColorFn(' ' + humanizeDuration(log.duration)) : ''
      ].join('')
    }
  })
}

export const createPrettyStream = (rootLogger, level) => {
  rootLogger.add({level, stream: createStream()})
}
