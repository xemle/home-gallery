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

export const createBasicAuthMiddleware = (users, rules) => {
  const userMap = users2UserMap(users)
  const whitelistRules = rules2WhitelistRules(rules || [])

  log.info(`Set basic auth for users: ${Object.keys(userMap).join(', ')}`)
  log.debug(whitelistRules, `Set ip whitelist rules to ${rules.map(({type, value}) => `${type}:${value}`).join(', ')}`)

  return (req, res, next) => {
    const clientIp = req.ip
    req.ignoreAuth = isWhitelistIp(whitelistRules, clientIp)
    if (req.ignoreAuth) {
      return next()
    }

    const [username, password] = getCredentials(req)
    if (!username) {
      log.debug(`Block client with ip ${clientIp}. Request authentication`)
    } else if (matchesUser(userMap, username, password)) {
      return next()
    } else {
      log.info(`Invalid credentials for user '${username}'. Block client with ip ${clientIp}. Request authentication`)
    }

    res.set('WWW-Authenticate', 'Basic realm="HomeGallery"')
    res.status(401).send('Authentication required')
  }
}

export const createCookieAuthMiddleware = (users, roles, rules, sessionStore) => {
  const resolvedUsers = resolveUsers(users, roles)
  const whitelistRules = rules2WhitelistRules(rules || [])

  const userNames = resolvedUsers.map(u => u.username).join(', ')
  log.info(`Set cookie auth for users: ${userNames}`)
  log.debug(whitelistRules, `Set ip whitelist rules to ${rules.map(({type, value}) => `${type}:${value}`).join(', ')}`)

  return (req, res, next) => {
    const clientIp = req.ip
    req.ignoreAuth = isWhitelistIp(whitelistRules, clientIp)
    if (req.ignoreAuth) {
      return next()
    }

    const sessionId = getSessionCookie(req)
    if (sessionId) {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        req.username = session.username
        req.roles = session.roles
        req.readOnly = session.readOnly
        return next()
      }
      log.debug(`Invalid or expired session from ip ${clientIp}`)
    }

    res.status(401).json({error: 'Authentication required'})
  }
}
