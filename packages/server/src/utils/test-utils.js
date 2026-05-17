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
  const routes = {}
  return {
    post(path, handler) { routes[`POST ${path}`] = handler },
    get(path, handler) { routes[`GET ${path}`] = handler },
    use(path, handler) {
      if (!handler) {
        handler = path
        path = '/'
      }
      routes[`* ${path}`] = handler
    },
    invoke(method, path, req, res, next) { return routes[`${method} ${path}`](req, res, next) }
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