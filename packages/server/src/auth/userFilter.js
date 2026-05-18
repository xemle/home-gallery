import { parse } from '@home-gallery/query'
import { resolveUsers } from './user.js'

const logPrefix = 'api.auth.userFilter'

const collectUsersWithFilter = (manager) => {
  const log = manager.createLogger(`${logPrefix}.query`)

  const config = manager.getConfig()
  const rawUsers = config.server?.auth?.users || []
  if (!rawUsers.length) {
    log.trace(`No users defined. Skip user filter`)
    return []
  }
  const roles = config.server?.auth?.roles || []
  const users = resolveUsers(rawUsers, roles)
  const usersWithFilter = users.filter(u => typeof u.filter === 'string' && u.filter !== '')

  const publicFilter = config.server?.auth?.public?.filter
  if (typeof publicFilter == 'string' && users.find(user => user.username == 'anonymous')) {
    log.warn('Can not set public filter to existing user: anonymous. Public filter is skipped')
  } else if (typeof publicFilter == 'string') {
    usersWithFilter.push({username: 'anonymous', filter: publicFilter})
  }

  const hasUsersButNoFilter = rawUsers.length && !usersWithFilter.length
  if (hasUsersButNoFilter) {
    log.debug(`Found ${rawUsers.length} users but no user filters are defined. Use 'filter: "year >= 2024"' in server.auth.users or server.auth.roles configuration to enable user filters`)
    return []
  }

  return usersWithFilter
}

const createUsername2FilterAst = async (manager, users) => {
  const log = manager.createLogger(`${logPrefix}.query`)
  const username2FilterAst = {}

  for (let user of users) {
    const ast = await parse(user.filter).catch(err => {
      log.warn(err, `Could not parse user filter from user ${user.username}: ${user.filter}. Skip filtering`)
      return false
    })
    if (!ast) {
      continue
    } else if (!ast?.value) {
      log.info(`Found no filter query for user ${user.username}: ${user.filter}. Is it only a 'order by' query?`)
      continue
    }

    log.info(`Setup query filter for user ${user.username}: ${user.filter}`)
    username2FilterAst[user.username] = ast.value
  }

  log.trace({userFilters: username2FilterAst}, `Setup ${Object.keys(username2FilterAst).length} user filters`)
  return username2FilterAst
}

const createUserFilterQueryPlugin = async manager => {
  const users = collectUsersWithFilter(manager)
  if (!users.length) {
    return false
  }

  const username2FilterAst = await createUsername2FilterAst(manager, users)

  return {
    name: 'userFilterQuery',
    order: 1,
    transformRules: [
      {
        transform(ast, context) {
          const isReq = context.plugin?.req
          const username = context.plugin?.req?.username || 'anonymous'
          if (ast.type != 'query' || !isReq || !username2FilterAst[username]) {
            return ast
          }
          const userFilterAst = username2FilterAst[username]
          const clone = JSON.parse(JSON.stringify(userFilterAst))
          if (!ast.value) {
            return {...ast, value: clone}
          }
          const and = {type: 'and', value: [clone, ast.value], col: ast.col}
          return {...ast, value: and}
        }
      }
    ],
  }
}

// Plugin setup  ---------------------------

const plugin = {
  name: 'userFilterPlugin',
  version: '1.0',
  requires: [],
  /** @param {import('@home-gallery/types').TPluginManager} manager */
  async initialize(manager) {
    const log = manager.createLogger(`${logPrefix}`)
    const context = manager.getContext()
    if (context.type == 'serverContext' || context.type == 'cliContext') {
      const filterPlugin = await createUserFilterQueryPlugin(manager)
      if (filterPlugin) {
        manager.register('query', filterPlugin)
      }
    } else {
      log.trace(`Skip query plugins for context type ${context.type}`)
    }
  }
}

export default plugin
