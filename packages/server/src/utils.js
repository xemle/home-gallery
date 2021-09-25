const useIf = (middleware, test) => (req, res, next) => test(req) ? middleware(req, res, next) : next()

const skipIf = (middleware, test) => useIf(middleware, req => !test(req))

const isIndex = req => req.path === '/' || req.path === '/index.html'

module.exports = {
  isIndex,
  skipIf,
  useIf
}
