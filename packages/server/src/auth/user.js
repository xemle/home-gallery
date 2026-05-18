import crypto from 'crypto';

export const matchesUser = (userMap, username, password) => {
  if (!username || !password || !userMap[username]) {
    return false
  }
  return userMap[username].testPassword(password)
}

const hashBase64 = (text, hash = 'sha1') => {
  const digest = crypto.createHash(hash);
  digest.update(text, 'utf8');
  return digest.digest('base64');
}

const getTestPassword = password => {
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

export const users2UserMap = users => {
  return users.reduce((result, {username, password}) => {
    result[username] = {
      testPassword: getTestPassword(password)
    }
    return result
  }, {})
}

const resolveEffectiveFilter = (user, rolesMap) => {
  let roleFilters = (user.roles || []).map(name => rolesMap[name]?.filter)
  if (user.filter) {
    roleFilters.push(user.filter)
  }
  const filters = [...new Set(roleFilters)];
  // If any role filter is unset or no filters provided, the union is unrestricted
  if (!filters.length || filters.some(f => typeof f !== 'string')) {
    return undefined
  }
  return filters.map(f => `(${f})`).join(' or ')
}

const resolveEffectivePages = (user, rolesMap) => {
  if (user.webapp?.pages) {
    return user.webapp.pages
  }
  const disabled = (user.roles || []).flatMap(name => rolesMap[name]?.webapp?.pages?.disabled || [])
  if (!disabled.length) {
    return undefined
  }
  return { disabled: [...new Set(disabled)] }
}

const resolveEffectiveReadOnly = (user, rolesMap) => {
  if (typeof user.readOnly === 'boolean') {
    return user.readOnly
  }

  const userRoleNames = user.roles || []
  if (!userRoleNames.length) {
    return false
  }

  // readOnly only if all the roles are readOnly
  return userRoleNames.every(name => rolesMap[name]?.readOnly === true)
}

/**
 * Resolve effective filter and readOnly per user, incorporating role settings.
 * Returns an array of resolved user objects used by the auth and filter plugins.
 */
export const resolveUsers = (users, roles) => {
  const rolesMap = (roles || []).reduce((map, role) => {
    map[role.name] = role
    return map
  }, {})

  return users.map(user => ({
    username: user.username,
    testPassword: getTestPassword(user.password),
    filter: resolveEffectiveFilter(user, rolesMap),
    roles: user.roles || [],
    readOnly: resolveEffectiveReadOnly(user, rolesMap),
    pages: resolveEffectivePages(user, rolesMap),
  }))
}
