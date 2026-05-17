import { getCredentials } from './credentials.js'

/**
 *
 * @param {import('../types.js').TServerContext} context
 * @returns
 */
export const augmentReqByUserMiddleware = (context) => {
  const { config, auth } = context || {}
  const sessionName = config?.server?.auth?.session?.sessionName || 'SESSIONID'

  /**
   * @param {import('express').Request & { username?: string, sessionId?: string }} req
   * @param {import('express').Response} _
   * @param {import('express').NextFunction} next
   */
  return async (req, _, next) => {
    const [username] = getCredentials(req)
    if (username) {
      req.username = username
      return next()
    }

    if (!req.sessionId) {
      return next()
    }

    const session = await auth?.sessionStore?.getSession(req.sessionId) || null
    if (session?.username) {
      req.username = session.username
    }

    next()
  }
}