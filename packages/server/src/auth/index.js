import { rules2WhitelistRules, isWhitelistIp } from './ip.js'
export { defaultIpWhitelistRules } from './ip.js'
import { users2UserMap, matchesUser, resolveUsers } from './user.js'
import { getSessionCookie } from './cookies.js'

import Logger from '@home-gallery/logger'

const log = Logger('server.auth');

const getCredentials = req => {
  if (!req.headers.authorization) {
    return []
  }
  const [schema, b64auth] = req.headers.authorization.split(' ')
  if (schema == 'Basic') {
    return Buffer.from(b64auth, 'base64').toString().split(':')
  }
  return []
}

export const augmentReqByUserMiddleware = () => (req, _, next) => {
  const [username] = getCredentials(req)
  if (username) {
    req.username = username
  }
  next()
}

export const createAuthMiddleware = (users, roles, rules, sessionStore, anonymousAccess, anonymousReadOnly, anonymousPages) => {
  const userMap = users2UserMap(users)
  const resolvedUsers = resolveUsers(users, roles)
  const resolvedUserMap = resolvedUsers.reduce((map, u) => { map[u.username] = u; return map }, {})
  const whitelistRules = rules2WhitelistRules(rules || [])

  const userNames = resolvedUsers.map(u => u.username).join(', ')
  log.info(`Set auth for users: ${userNames}`)
  log.debug(whitelistRules, `Set ip whitelist rules to ${rules.map(({type, value}) => `${type}:${value}`).join(', ')}`)

  return (req, res, next) => {
    const clientIp = req.ip
    req.ignoreAuth = isWhitelistIp(whitelistRules, clientIp)
    if (req.ignoreAuth) {
      return next()
    }

    // 1. Try Basic auth credentials
    const [username, password] = getCredentials(req)
    if (username) {
      if (matchesUser(userMap, username, password)) {
        const resolvedUser = resolvedUserMap[username]
        req.username = username
        req.readOnly = resolvedUser?.readOnly || false
        req.pages = resolvedUser?.pages
        log.debug(`Basic auth accepted for user '${username}' from ${clientIp}`)
        return next()
      }
      log.info(`Invalid basic credentials for user '${username}' from ${clientIp}`)
    }

    // 2. Try Cookie session
    const sessionId = getSessionCookie(req)
    if (sessionId) {
      const session = sessionStore ? sessionStore.getSession(sessionId) : null
      if (session) {
        req.username = session.username
        req.roles = session.roles
        req.readOnly = session.readOnly
        req.pages = session.pages
        return next()
      }
      log.debug(`Invalid or expired session from ip ${clientIp}`)
    }

    // 3. Anonymous access
    if (anonymousAccess) {
      req.readOnly = anonymousReadOnly
      req.pages = anonymousPages
      log.debug(`Anonymous access from ${clientIp} (public mode, readOnly=${anonymousReadOnly})`)
      return next()
    }

    // 4. Deny
    if (username) {
      res.set('WWW-Authenticate', 'Basic realm="HomeGallery"')
    }
    res.status(401).json({error: 'Authentication required'})
  }
}
