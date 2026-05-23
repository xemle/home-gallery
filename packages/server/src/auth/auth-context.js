import { isAllowListedIp, rules2AllowListRules } from "./ip.js"
import { createFileStore } from "./session/file-store.js"
import { createMemoryStore } from "./session/memory-store.js"
import { createSessionStore } from "./session/session-store.js"
import { createUserMap } from "./user.js"

/**
 * Create the authentication context based on the provided configuration
 *
 * @param {any} config
 * @returns {Promise<import('./types.js').TAuthContext>}
 */
export async function createAuthContext(config) {
  const auth = config?.server?.auth || {}

  const users = createUserMap(auth.users || [], auth.roles || [], auth.public?.filter)
  const allowListRules = rules2AllowListRules(auth.rules || [])

  const sessionFile = auth?.session?.file
  const store = auth.users?.length && sessionFile ? createFileStore(sessionFile) : createMemoryStore()
  const sessionStore = await createSessionStore(store)

  const usernames = Object.keys(users)
  const hasUsers = usernames.filter(name => name != '$allow' && name != '$anonymous').length > 0
  const allowAnonymous = usernames.filter(name => name == '$anonymous').length > 0

  /**
   * @param {import('express').Request} req
   */
  function isAllowListed(req) {
    const clientIp = req.ip
    return isAllowListedIp(allowListRules, clientIp)
  }

  /**
   * @param {import('express').Request & {username?: string, user?: import("./types.js").TUser}} req
   */
  function setDefaultUser(req) {
    if (isAllowListed(req)) {
      req.username = '$allow'
      req.user = users['$allow']
      return true
    }

    if (allowAnonymous) {
      req.username = '$anonymous'
      req.user = users['$anonymous']
      return true
    }

    return false
  }

  const authContext = {
    hasUsers,
    allowAnonymous,
    users,
    sessionStore,
    isAllowListed,
    setDefaultUser,
  }

  return authContext
}