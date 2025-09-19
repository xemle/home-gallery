import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware';
import Logger from '@home-gallery/logger'

const log = Logger('cast.proxy')

type TProxyConfig = {
  serverUrl: string,
  host: string,
  port: number,
  sessionId: string,
}

const proxyCb = ({serverUrl, port, host, sessionId}: TProxyConfig, cb) => {
  const app = express()

  app.use(`/${sessionId}/files`, createProxyMiddleware({
    target: serverUrl,
    changeOrigin: true,
    secure: false,
    pathRewrite: path => '/files' + path,
  }));

  const server = app.listen(port, host, (err) => {
    if (err) {
      return cb(err)
    }
    log.debug(`Proxy server listening at http://${host}:${port} for session ${sessionId}`)
    cb(null, server, app)
  })
}

export const proxy = async (config: TProxyConfig) => {
  return new Promise((resolve, reject) => {
    proxyCb(config, (err, server, app) => {
      if (err) {
        return reject(err)
      }
      resolve([server, app])
    })
  })
}
