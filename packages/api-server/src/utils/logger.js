import pino from 'pino'

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      ignore: 'req,res,responseTime'
    }
  },
  level: 'debug',
})

export default logger