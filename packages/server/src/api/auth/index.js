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

  if (!users['$anonymous']) {
    log.info(`Anonymous access is disabled, basic authentication is required for all users. Disable /api/auth routes`)
    return
  }

  log.debug(`Enable /api/auth for user authentication`)

  const sessionName = config.server?.auth?.session?.sessionName || 'SESSIONID'
  const maxAge = config.server?.auth?.session?.maxAge || SESSION_COOKIE_MAX_AGE_SECONDS

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

      res.json({username: user.username, roles: user.roles})
    }
  )

  router.post(
    '/api/auth/logout',
    /**
     * @param {import('express').Request & {sessionId?: string}} req
     * @param {import('express').Response} res
     */
    async (req, res) => {
      const sessionId = req.sessionId
      if (sessionId) {
        const session = await sessionStore.getSession(sessionId)
        if (session) {
          log.info(`User '${session.username}' logged out from ${req.ip}`)
        }
        await sessionStore.deleteSession(sessionId)
      }
      clearSessionCookie(res, sessionName)
      res.json({ok: true})
    }
  )

  router.get(
    '/api/auth/me',
    /**
     * @param {import('express').Request & {sessionId?: string}} req
     * @param {import('express').Response} res
     */
    async (req, res) => {
      const sessionId = req.sessionId
      if (!sessionId) {
        return res.status(401).json({error: 'Not authenticated'})
      }

    const session = await sessionStore.getSession(sessionId)
    if (!session) {
      clearSessionCookie(res, sessionName)
      return res.status(401).json({error: 'Session expired'})
    }

    const user = users[session.username]

    res.json({username: user.username, roles: user.roles})
  })
}
