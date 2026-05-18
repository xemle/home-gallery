import Logger from '@home-gallery/logger'

import { isAllowListedIp, rules2AllowListRules } from './ip.js'
import { matchesUser } from './user.js'
import { getCredentials } from './credentials.js';

export { defaultIpAllowListRules as defaultIpWhitelistRules } from './ip.js'

const log = Logger('server.auth');

/**
 *
 * @param {import('../types.js').TServerContext} context
 * @returns
 */
export const authMiddleware = async (context) => {
  const { config, auth, router } = context

  const rules = config.server?.auth?.rules || []
  const allowListRules = rules2AllowListRules(rules || [])

  const usernames = Object.keys(auth?.users || {})
  const ordinaryUsernames = usernames.filter(u => u !== '$allow' && u !== '$anonymous')
  if (ordinaryUsernames.length) {
    log.info({users: redact(auth?.users || {})}, `Enabled authentication for users: ${ordinaryUsernames.join(', ')}`)
  }
  if (usernames.includes('$anonymous')) {
    log.info(`Enabled anonymous public access`)
  }
  log.debug(allowListRules, `Set ip allow list rules to ${allowListRules.map(({type, value}) => `${type}:${value}`).join(', ')}`)

  /**
   * @param {import('express').Request & { username?: string, user?: import('./types.js').TUser, sessionId?: string }} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  const middleware = async (req, res, next) => {
    const clientIp = req.ip

    // 1. Try Basic auth credentials
    const [username, password] = getCredentials(req)
    if (username) {
      if (matchesUser(auth.users, username, password)) {
        req.username = username
        req.user = auth.users[username]
        return next()
      }
      log.info(`Invalid basic credentials for user '${username}' from ${clientIp}`)

      res.set('WWW-Authenticate', 'Basic realm="HomeGallery"')
      res.status(401).json({error: 'Invalid credentials'})
      return
    }

    // 2. Try Cookie session
    const sessionId = req.sessionId
    if (sessionId) {
      const session = await auth?.sessionStore?.getSession(sessionId) || null
      if (session?.username && auth?.users[session.username]) {
        req.username = session.username
        req.user = auth.users[session.username]
        return next()
      }
      log.debug(`Invalid or expired session from ip ${clientIp}`)
    }

    // 3. Check IP from allow list
    const isAllowListed = isAllowListedIp(allowListRules, clientIp)
    if (isAllowListed) {
      req.username = '$allow'
      req.user = auth.users['$allow']
      return next()
    }

    // 4. Anonymous access
    if (auth?.allowAnonymous) {
      req.username = '$anonymous'
      req.user = auth.users['$anonymous']
      return next()
    }

    // 5. Deny
    log.debug(`Unauthorized access attempt to ${req.path} from ip ${clientIp}`)
    res.set('WWW-Authenticate', 'Basic realm="HomeGallery"')
    res.status(401).json({error: 'Authentication required'})
  }

  router.use(middleware)
}

/**
 * Redact sensitive information from user objects for logging
 *
 * @param {Record<string, import('./types.js').TUser>} users
 * @returns {Record<string, Omit<import('./types.js').TUser, 'testPassword'>>}
 */
function redact(users) {
  return Object.fromEntries(Object.entries(users)
    .filter(([username, user]) => {
      const reductedUser = Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'testPassword'))
      return [username, reductedUser]
    }))
}
