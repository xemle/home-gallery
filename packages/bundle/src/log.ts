import pino from 'pino'
import pretty from 'pino-pretty'

const stream = pretty({
  levelFirst: false,
  translateTime: 'SYS:isoTime',
  ignore: 'hostname,pid,module',
  messageFormat: '{module}: {msg}',
})

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, stream)
