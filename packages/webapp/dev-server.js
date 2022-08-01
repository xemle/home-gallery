const path = require('path')
const express = require('express')
const compression = require('compression')
const { createProxyMiddleware } = require('http-proxy-middleware')


const PORT = process.env.PORT || 1234
const API_PROXY = process.env.API_PROXY || 'http://localhost:3000'

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
  response.sendFile(path.resolve(baseDir, 'index.html'));
});

// Run your Express server
app.listen(PORT);
