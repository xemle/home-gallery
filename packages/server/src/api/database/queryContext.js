import Logger from '@home-gallery/logger'
import { stringifyEntry } from '@home-gallery/query'

const log = Logger('server.queryContext')

export const createQueryContext = (context, req = {}) => {
  const { config } = context

  return {
    textFn: (entry) => stringifyEntry(entry),
    queryErrorHandler(ast, queryContext, reason) {
      log.info(ast, `Query error occured: ${reason}`)
    },
    plugin: {
      req: req.method ? {
        remoteAdress: req.remoteAdress,
        ignoreAuth: req.ignoreAuth,
        username: req.username || 'anonymous'
      } : false
    },
    config,
  }
}