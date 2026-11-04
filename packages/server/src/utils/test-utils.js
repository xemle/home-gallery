export const loggerMock = () => ({
  '@home-gallery/logger': {
    default: () => ({
      info() {},
      debug() {},
      warn() {},
      error() {},
      trace() {}
    })
  }
})

export const mockRouter = () => {
  const routes = {}
  return {
    post(path, handler) { routes[`POST ${path}`] = handler },
    get(path, handler) { routes[`GET ${path}`] = handler },
    invoke(method, path, req, res) { return routes[`${method} ${path}`](req, res) }
  }
}

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