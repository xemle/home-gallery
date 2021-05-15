import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: {
    levelFirst: false,
    translateTime: 'SYS:isoTime',
    ignore: 'hostname,pid,module',
    messageFormat: '{module}: {msg}',
  },
  prettifier: require('pino-pretty')
 })
