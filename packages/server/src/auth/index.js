const { rules2WhitelistRules, defaultIpWhitelistRules, isWhitelistIp } = require('./ip')
const { users2UserMap, matchesUser } = require('./user')

const log = require('@home-gallery/logger')('server.auth');

const getCredentials = req => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  return Buffer.from(b64auth, 'base64').toString().split(':')
}

const createBasicAuthMiddleware = (users, rules) => {
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
      log.debug(`Invalid credentials for user '${login}'. Block client with ip ${clientIp}. Request authentication`)
    }

    res.set('WWW-Authenticate', 'Basic realm="HomeGallery"')
    res.status(401).send('Authentication required')
  }
}

module.exports = {
  createBasicAuthMiddleware,
  defaultIpWhitelistRules
}