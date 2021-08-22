const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware');
const log = require('@home-gallery/logger')('cast.proxy');

const proxy = ({serverUrl, port, host, sessionId}, cb) => {
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

const proxyAsync = async (config) => {
  return new Promise((resolve, reject) => {
    proxy(config, (err, server, app) => {
      if (err) {
        return reject(err)
      }
      resolve([server, app])
    })
  })
}

module.exports = {
  proxy: proxyAsync
}
