import fs from 'fs'

import pino, { StreamEntry, Level } from 'pino'
import pretty from 'pino-pretty'

const streams : StreamEntry[] = [
  {
    level: 'debug',
    stream: fs.createWriteStream('bundle-debug.log')
  },
  {
    level: <Level>process.env.LOG_LEVEL || 'info',
    stream: pretty({
      levelFirst: false,
      translateTime: 'SYS:isoTime',
      ignore: 'hostname,pid,module',
      messageFormat: '{module}: {msg}',
    })
  }
]

export const logger = pino({
  level: 'debug'
}, pino.multistream(streams))
