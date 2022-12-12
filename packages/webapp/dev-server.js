const path = require('path')
const express = require('express')
const compression = require('compression')
const { createProxyMiddleware } = require('http-proxy-middleware')
const livereload = require('livereload')
const open = require('open')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || 1234
const API_PROXY = process.env.API_PROXY || 'http://127.0.0.1:3000'

const baseDir = 'dist'

const app = express()

app.use(compression())
app.use(
  '/api/',
  createProxyMiddleware({
    target: API_PROXY,
    secure: false
  })
);
app.use(
  '/files/',
  createProxyMiddleware({
    target: API_PROXY,
    secure: false
  })
);

app.set('etag', 'weak')
app.use(express.static(baseDir))
app.get('*', (_, response) => {
  response.sendFile(path.resolve(baseDir, 'index.html'))
});

// Run your Express server
app.listen(PORT, HOST, err => {
  if (err) {
    console.log(`Failed to start server: ${err}`)
  } else {
    console.log(`Dev server is listening on port http://localhost:${PORT} with api proxy to ${API_PROXY}`)
    open(`http://localhost:${PORT}`)
  }
})

const livereloadServer = livereload.createServer({}, err => {
  if (err) {
    console.log(`Failed to start live reload server: ${err}`)
  } else {
    console.log(`Live reload server is listening on port 35729`)
  }
})
livereloadServer.watch(baseDir)