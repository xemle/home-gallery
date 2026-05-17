import { parse } from '@home-gallery/query'
import { createUserMap } from './user.js'

const logPrefix = 'api.auth.userFilter'

/**
 *
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns
 */
const createUsername2FilterAst = async (manager) => {
  const log = manager.createLogger(`${logPrefix}.query`)
  /** @type {Record<string, any>} */
  const username2FilterAst = {}

  const auth = manager.getConfig()?.server?.auth || {}
  const users = createUserMap(auth.users || [], auth.roles || [], auth.public?.filter)

  if (!Object.keys(users).length) {
    log.info('Serve all media files without restrictions. Define users to change it')
    return username2FilterAst
  }

  for (const user of Object.values(users)) {
    if (!user.filter) {
      continue
    }

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

/**
 *
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns
 */
const createUserFilterQueryPlugin = async manager => {
  const username2FilterAst = await createUsername2FilterAst(manager)

  return {
    name: 'userFilterQuery',
    order: 1,
    transformRules: [
      {
        /**
         *
         * @param {any} ast
         * @param {any} context
         * @returns
         */
        transform(ast, context) {
          const isReq = context.plugin?.req
          const username = context.plugin?.req?.username || '$allow'
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
