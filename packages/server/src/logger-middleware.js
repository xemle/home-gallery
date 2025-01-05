import pinoHttp from 'pino-http'
import logger from '@home-gallery/logger'

export const loggerMiddleware = () => {
  const customMessage = log => `${log.statusCode} ${log.req.method} ${log.req.baseUrl}${log.req.url} ${Date.now() - log[pinoHttp.startTime]}ms`

  return pinoHttp({
    logger: logger('server.request'),
    serializers: {
      req: req => req.raw.username ? ({...req, user: req.raw.username}) : req
    },
    redact: {
      paths: ['req.headers.authorization'],
      censor: '*** (masked value)'
    },
    customLogLevel: (res, err) => {
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
    customErrorMessage: (err, o) => customMessage(o)
  })
}
