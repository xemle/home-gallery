import { resolveUsers } from '../../auth/user.js'
import { setSessionCookie, clearSessionCookie, getSessionCookie } from '../../auth/cookies.js'

import Logger from '@home-gallery/logger'

const log = Logger('server.api.auth')

/**
 * @param {import('../../types.js').TServerContext} context
 * @param {import('../../auth/session-store.js').SessionStore} sessionStore
 */
export async function authApi(context, sessionStore) {
  const { config, router } = context
  const users = config.server?.auth?.users || []
  const roles = config.server?.auth?.roles || []
  const resolvedUsers = resolveUsers(users, roles)
  const userMap = resolvedUsers.reduce((map, u) => { map[u.username] = u; return map }, {})

  router.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({error: 'Username and password are required'})
    }

    const user = userMap[username]
    if (!user || !user.testPassword(password)) {
      log.info(`Failed login attempt for user '${username}' from ${req.ip}`)
      return res.status(401).json({error: 'Invalid credentials'})
    }

    const sessionId = sessionStore.createSession(user.username, user.roles, user.readOnly)
    setSessionCookie(res, sessionId)
    log.info(`User '${username}' logged in from ${req.ip}`)

    res.json({username: user.username, roles: user.roles, readOnly: user.readOnly})
  })

  router.post('/api/auth/logout', (req, res) => {
    const sessionId = getSessionCookie(req)
    if (sessionId) {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        log.info(`User '${session.username}' logged out from ${req.ip}`)
      }
      sessionStore.deleteSession(sessionId)
    }
    clearSessionCookie(res)
    res.json({ok: true})
  })

  router.get('/api/auth/me', (req, res) => {
    const sessionId = getSessionCookie(req)
    if (!sessionId) {
      return res.status(401).json({error: 'Not authenticated'})
    }

    const session = sessionStore.getSession(sessionId)
    if (!session) {
      clearSessionCookie(res)
      return res.status(401).json({error: 'Session expired'})
    }

    res.json({username: session.username, roles: session.roles, readOnly: session.readOnly})
  })
}
