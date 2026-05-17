import Logger from '@home-gallery/logger'

const log = Logger('server.auth.disable');

/**
 * Create a middleware and checks agains a user disabled flag
 *
 * @param {string} disableFlag
 * @returns
 */
export function createDisabledFlagMiddleware(disableFlag) {
  /**
   * @param {import('express').Request & {username?: string, user?: import('./types.js').TUser}} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  const middleware = (req, res, next) => {
    const disabled = req.user?.webapp?.disabled || []
    if (disabled.includes(disableFlag)) {
      log.debug(`Deny resouce ${req.path} for user ${req.username} by disable flag ${disableFlag}`)
      return res.status(404).send()
    }

    next()
  }

  return middleware
}