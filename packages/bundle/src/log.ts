import fs from 'fs'

import pino, { StreamEntry, Level } from 'pino'
import pretty from 'pino-pretty'

const streams : StreamEntry[] = [
  {
    level: <Level>process.env.LOG_LEVEL || 'debug',
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

let instance: import('pino').Logger

export const logger = (name: string) => {
  if (!instance) {
    instance = pino({
      level: 'trace'
    }, pino.multistream(streams))
  }

  return instance.child({module: name})
}
