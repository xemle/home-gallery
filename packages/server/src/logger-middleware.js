const pinoHttp = require('pino-http')
const logger = require('@home-gallery/logger')

const loggerMiddleware = () => {
  const customMessage = log => `${log.statusCode} ${log.req.method} ${log.req.url} ${Date.now() - log[pinoHttp.startTime]}ms`

  return pinoHttp({
    logger: logger('server.request'),
    customLogLevel: (res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn'
      } else if (res.statusCode >= 500 || err) {
        return 'error'
      } else if (res.req.originalUrl.startsWith('/files')) {
        return 'debug'
      }
      return 'info'
    },
    customSuccessMessage: customMessage,
    customErrorMessage: (err, o) => customMessage(o)
  })
}

module.exports = {
  loggerMiddleware
}