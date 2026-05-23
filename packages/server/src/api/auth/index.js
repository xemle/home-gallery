import { clearSessionCookie, setSessionCookie } from '../../auth/session/cookies.js'

import Logger from '@home-gallery/logger'

const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days in seconds
const log = Logger('server.api.auth')

/**
 * @param {import('../../types.js').TServerContext} context
 */
export async function authApi(context) {
  const { config, router, auth } = context
  const { users, sessionStore } = auth || {}

  if (!auth.allowAnonymous) {
    log.info(`Anonymous access is disabled, basic authentication is required for all users. Disable /api/auth routes`)
    return
  }

  log.debug(`Enable /api/auth for user authentication`)

  const sessionConfig = config.server?.auth?.session || {}
  const sessionName = sessionConfig.sessionName || 'SESSIONID'
  const maxAge = sessionConfig.maxAge || SESSION_COOKIE_MAX_AGE_SECONDS

  router.post(
    '/api/auth/login',
    async (req, res) => {
      const { username, password } = req.body || {}

      if (!username || !password) {
        return res.status(401).json({error: 'Invalid credentials'})
      }

      const user = users[username]
      if (!user || !user.testPassword(password)) {
        log.info(`Failed login attempt for user '${username}' from ${req.ip}`)
        return res.status(401).json({error: 'Invalid credentials'})
      }

      const sessionId = await sessionStore?.createSession(user.username, user.roles)
      setSessionCookie(res, sessionId, sessionName, maxAge)
      log.info(`User '${username}' logged in from ${req.ip}`)

      res.json({
        data: {
          username: user.username,
          roles: user.roles,
          webapp: user.webapp
        }
      })
    }
  )

  router.post(
    '/api/auth/logout',
    /**
     * @param {import('express').Request & {sessionId?: string, user?: import("../../auth/types.js").TUser}} req
     * @param {import('express').Response} res
     */
    async (req, res) => {
      const sessionId = req.sessionId
      clearSessionCookie(res, sessionName)
      if (sessionId) {
        const session = await sessionStore.getSession(sessionId)
        if (session) {
          log.info(`User '${session.username}' logged out from ${req.ip}`)
        }
        await sessionStore.deleteSession(sessionId)
      }
      if (!auth.setDefaultUser(req)) {
        return res.json({ok: true})
      }

      const user = /** @type {import("../../auth/types.js").TUser} */ (req.user)
      res.json({
        ok: true,
        data: {
          username: user.username,
          roles: user.roles,
          webapp: req.user?.webapp
        }
      })
    }
  )

  router.get(
    '/api/auth/me',
    /**
     * @param {import('express').Request & {sessionId?: string, user?: import("../../auth/types.js").TUser}} req
     * @param {import('express').Response} res
     */
    async (req, res) => {
      const sessionId = req.sessionId
      if (!sessionId) {
        return res.status(401).json({error: 'Not authenticated'})
      }

    const session = await sessionStore.getSession(sessionId)
    if (!session || !auth.users[session.username]) {
      clearSessionCookie(res, sessionName)
      return res.status(401).json({error: 'Invalid session'})
    }
    
    const user = auth.users[session.username]
    res.json({
      data: {
        username: user.username,
        roles: user.roles,
        webapp: user.webapp
      }
    })
  })
}
