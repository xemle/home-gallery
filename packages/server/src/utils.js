export const useIf = (middleware, test) => (req, res, next) => test(req) ? middleware(req, res, next) : next()

export const skipIf = (middleware, test) => useIf(middleware, req => !test(req))

export const isIndex = req => req.path === '/' || req.path === '/index.html'

