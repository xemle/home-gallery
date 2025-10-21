export const useIf = (middleware, test) => (req, res, next) => test(req) ? middleware(req, res, next) : next()

export const skipIf = (middleware, test) => useIf(middleware, req => !test(req))

export const isIndex = req => req.path === '/' || req.path === '/index.html'

/**
 * Ensure leading and tailing slash. Allow base path with schema like http://foo.com/bar
 */
export const browserBasePath = basePath => {
  let path = `${basePath || '/'}`
  if (!path.startsWith('/') && path.indexOf('://') < 0) {
    path = '/' + path
  }
  return path.endsWith('/') ? path : path + '/'
}

export const routerPrefix = basePath => {
  let path = browserBasePath(basePath)
  return path.match(/[^/]\/$/) ? path.substring(0, path.length - 1) : path
}