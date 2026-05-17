import { getSessionCookie } from "./cookies.js"

/**
 * @param {import("../../types.js").TServerContext} context 
 */
export function createCookieMiddleware(context) {
  const { config, router } = context
  const sessionName = config.server?.auth?.session?.sessionName || 'SESSIONID'

  /**
   * @param {import('express').Request & { sessionId?: string | false}} req
   * @param {import('express').Response} _
   * @param {import('express').NextFunction} next
   */
  const middleware = (req, _, next) => {
    req.sessionId = getSessionCookie(req, sessionName) || false
    next()
  }

  router.use(middleware)
}