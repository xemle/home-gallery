import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware';

const proxyCb = ({serverUrl, port, host, sessionId}, cb) => {
  const app = express()

  app.use(`/${sessionId}/files`, createProxyMiddleware({
    target: serverUrl,
    changeOrigin: true,
    secure: false,
    pathRewrite: path => path.replace(`/${sessionId}/files`, '/files')
  }));

  const server = app.listen(port, host, (err) => {
    if (err) {
      return cb(err)
    }
    cb(null, server, app)
  })
}

export const proxy = async (config) => {
  return new Promise((resolve, reject) => {
    proxyCb(config, (err, server, app) => {
      if (err) {
        return reject(err)
      }
      resolve([server, app])
    })
  })
}
