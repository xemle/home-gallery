import crypto from 'crypto';
import { deepMerge } from '../utils/deep-merge.js';

/**
 *
 * @param {Record<string, import('./types.js').TUser>} userMap
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
export const matchesUser = (userMap, username, password) => {
  if (!username || !password || !userMap[username]) {
    return false
  }
  return userMap[username].testPassword(password)
}

/**
 * Hash the given text with the specified hash algorithm and return the result in base64 encoding.
 * @param {string} text
 * @param {string} hash
 * @returns {string}
 */
const hashBase64 = (text, hash = 'sha1') => {
  const digest = crypto.createHash(hash);
  digest.update(text, 'utf8');
  return digest.digest('base64');
}

/**
 * @param {string | undefined} password
 * @returns {function(string): boolean} A function that tests a password against the given password definition
 */
const getTestPassword = password => {
  if (!password) {
    return () => false
  }

  if (password.startsWith('{SHA256-salted}')) {
    const pos = password.indexOf('.')
    const salt = Buffer.from(password.substring(15, pos), 'base64').toString()
    return pwd => hashBase64(salt + pwd, 'sha256') == password.substring(pos + 1)
  } else if (password.startsWith('{SHA}')) {
    return pwd => hashBase64(pwd) == password.slice(5)
  } else if (password.startsWith('{PLAIN}')) {
      return pwd => pwd == password.slice(7)
  } else {
    return pwd => pwd == password
  }
}

/**
 * Resolve effective filter incorporating role settings.
 * Returns an array of resolved user objects used by the auth and filter plugins.
 *
 * @param {import('./types.js').TUserConfig[]} users - The list of user definitions from the config
 * @param {import('./types.js').TRoleConfig[]} roles - The list of role definitions from the config
 * @param {string} deprecatedPublicFilter - Deprecated. The filter for the public user, used if `$allow` user is not defined
 * @returns {Record<string, import('./types.js').TUser>} Map of username to user object
 */
export const createUserMap = (users, roles = [], deprecatedPublicFilter = '') => {
  const rolesMap = roles.reduce((map, role) => {
    map[role.name] = role
    return map
  }, /** @type {Record<string, import('./types.js').TRoleConfig>} */ ({}))

  const usersMap = users.map(toUserObject).filter(u => !!u).reduce((map, user) => {
    map[user.username] = {
      username: user.username,
      testPassword: getTestPassword(user.password),
      filter: resolveEffectiveFilter(user, rolesMap),
      roles: resolveUserRoles(user, rolesMap),
      webapp: resolveEffectiveWebapp(user, rolesMap),
    }
    return map
  }, /** @type {Record<string, import('./types.js').TUser>} */ ({}))

  if (!usersMap['$allow']) {
    usersMap['$allow'] = {
      username: '$allow',
      testPassword: () => false,
      filter: deprecatedPublicFilter || '',
      roles: [],
      webapp: {},
    }
  }

  return usersMap
}

/**
 *
 * @param {import('./types.js').TUserConfig} user
 * @returns {import('./types.js').TUserConfigObject | false} user object with username and password properties, or false if the input is invalid
 */
function toUserObject(user) {
  if (typeof user === 'string') {
    const pos = user.indexOf(':')
    if (pos < 0) {
      return {
        username: user,
        password: ''
      }
    }
    return {
      username: user.substring(0, pos),
      password: user.substring(pos + 1)
    }
  }

  // allow only objects
  if (typeof user !== 'object' || typeof user.username != 'string') {
    return false
  }

  return user
}

/**
 * Combine user filter with role filters. User filter is an AND filter to the OR combination of all role filters.
 *
 * @param {import('./types.js').TUserConfig} user
 * @param {Record<string, import('./types.js').TRoleConfig>} rolesMap
 * @returns {string} effective filter for the user
 */
function resolveEffectiveFilter(user, rolesMap) {
  if (typeof user == 'string') {
    return ''
  }

  let userFilter = user.filter?.trim() || ''

  let orRolesFilters = resolveUserRoles(user, rolesMap)
    .map(name => rolesMap[name]?.filter?.trim())
    .filter(roleFilter => !!roleFilter)
    .map((roleFilter, i, arr) => arr.length > 1 ? `(${roleFilter})` : roleFilter)
    .join(' or ')

  if (!userFilter && !orRolesFilters) {
    return ''
  }
  if (userFilter && orRolesFilters) {
    return `(${userFilter}) and (${orRolesFilters})`
  }
  return userFilter ? userFilter : orRolesFilters
}

/**
 * Resolve the roles for a given user, including any inherited roles
 *
 * @param {import('./types.js').TUserConfig} user
 * @param {Record<string, import('./types.js').TRoleConfig>} rolesMap
 * @returns {string[]} List of role names for the user
 */
function resolveUserRoles(user, rolesMap) {
  if (typeof user === 'string') {
    return []
  }

  const roleNames = new Set(user.roles || [])
  let size
  do {
    size = roleNames.size
    for (let roleName of roleNames) {
      rolesMap[roleName].roles?.forEach(name => roleNames.add(name))
    }
  } while (roleNames.size > size)

  return [...roleNames]
}

/**
 * @param {import('./types.js').TUserConfig} user
 * @param {Record<string, import('./types.js').TRoleConfig>} rolesMap
 * @returns {Object} Effective webapp configuration for the user
 */
function resolveEffectiveWebapp(user, rolesMap) {
  return resolveUserRoles(user, rolesMap)
    .map(name => rolesMap[name])
    .filter(role => !!role?.webapp)
    .reduce((webapp, role) => deepMerge(webapp, role.webapp), {})
}

