import pinoHttp from 'pino-http'

import logger from '../utils/logger.js'

export default function loggerMiddleware() {
  const customMessage = (req, res, responseTime, err) => `${res.statusCode} ${req.method} ${req.baseUrl}${req.url} ${err ? `with error: ${err} ` : ''}${responseTime}ms`

  return pinoHttp({
    logger,
    redact: {
      paths: ['req.headers.authorization'],
      censor: '*** (masked value)'
    },
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn'
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        return 'info'
      } else if (res.statusCode >= 500 || err) {
        return 'error'
      } else if (res.req.originalUrl.startsWith('/files')) {
        return 'trace'
      }
      return 'debug' // default log level
    },
    customSuccessMessage: customMessage,
    customErrorMessage: (req, res, err, responseTime) => customMessage(req, res, responseTime, err)
  })
}
