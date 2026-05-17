// @ts-nocheck
const logMessages = []

const mockFn = (level, ...args) => logMessages.push({level, time: new Date(), args})

export const getLogMessages = () => logMessages
export const clearLogMessages = () => logMessages.length = 0

export const loggerMock = () => ({
  '@home-gallery/logger': {
    default: () => ({
      info: (...args) => mockFn('info', ...args),
      debug: (...args) => mockFn('debug', ...args),
      warn: (...args) => mockFn('warn', ...args),
      error: (...args) => mockFn('error', ...args),
      trace: (...args) => mockFn('trace', ...args),
    })
  }
})

/**
 * @returns {import('express').Router & {invoke: (method: string, path: string, req: any, res: any) => any}}
 */
export const mockRouter = () => {
  const routes = []

  function pushRoute(method, args) {
    const path = typeof args[0] == 'string' ? args.shift() : '/'
    for (const handler of args) {
      routes.push({method, path, handler})
    }
  }

  async function invokeNext(offset, req, res, next = () => true) {
    let index = -1
    for (let i = offset; i < routes.length; i++) {
      const route = routes[i]
      const method = req.method || 'GET'
      if (route.method && route.method != method) {
        continue
      }
      const path = req.path || '/'
      if (route.path.startsWith(path)) {
        index = i
        break
      }
    }
    if (index < 0) {
      return next()
    }
    const route = routes[index]
    let nextCall
    await Promise.resolve(route.handler(req, res, () => {
      nextCall = invokeNext(index + 1, req, res, next)
    }))

    return nextCall
  }

  return {
    post(...args) { pushRoute('POST', args) },
    get(...args) { pushRoute('GET', args) },
    use(...args) { pushRoute(undefined, args) },
    invoke(req, res, next) { return invokeNext(0, req, res, next) }
  }
}

/**
 * @returns {import('express').Response}
 */
export const mockRes = () => {
  const res = {_status: 200, _body: null, _setCookies: [], _headers: {}}
  res.status = (code) => {
    res._status = code;
    return res
  }
  res.json = (body) => {
    res._body = body;
    return res
  }
  res.set = (k, v) => {
    res._headers[k] = v;
    return res
  }
  res.setHeader = (k, v) => {
    if (k === 'Set-Cookie') res._setCookies.push(v);
    res._headers[k] = v;
    return res
  }
  return res
}