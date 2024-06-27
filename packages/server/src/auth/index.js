import { rules2WhitelistRules, isWhitelistIp } from './ip.js'
export { defaultIpWhitelistRules } from './ip.js'
import { users2UserMap, matchesUser } from './user.js'

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
  const [login] = getCredentials(req)
  if (login) {
    req.user = login
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
    if (isWhitelistIp(whitelistRules, clientIp)) {
      return next()
    }

    const [login, password] = getCredentials(req)
    if (!login) {
      log.debug(`Block client with ip ${clientIp}. Request authentication`)
    } else if (matchesUser(userMap, login, password)) {
      return next()
    } else {
      log.info(`Invalid credentials for user '${login}'. Block client with ip ${clientIp}. Request authentication`)
    }

    res.set('WWW-Authenticate', 'Basic realm="HomeGallery"')
    res.status(401).send('Authentication required')
  }
}
