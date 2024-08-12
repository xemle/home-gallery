import Logger from '@home-gallery/logger'
import { stringifyEntry } from '@home-gallery/query'

const log = Logger('server.queryContext')

/**
 * @param {import('../../types.js').TServerContext} context
 * @param {object} [req] Server request
 * @returns {import('@home-gallery/types').TQueryContext}
 */
export const createQueryContext = (context, req = {}) => {
  const { config } = context

  return {
    textFn: (entry) => stringifyEntry(entry),
    queryErrorHandler(ast, queryContext, reason) {
      log.info(ast, `Query error occured: ${reason}`)
    },
    plugin: {
      req: req.method ? {
        remoteAddress: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress,
        ignoreAuth: req.ignoreAuth,
        username: req.username || 'anonymous'
      } : false
    },
    config,
  }
}