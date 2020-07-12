const proxy = require('http-proxy-middleware');
const Bundler = require('parcel-bundler');
const express = require('express');

const bundler = new Bundler('src/index.html', {
  // Don't cache anything in development 
  cache: false,
});

const app = express();
const PORT = process.env.PORT || 1234;
const API_PROXY = process.env.API_PROXY || 'http://localhost:3000';

app.use(
  '/api/',
  proxy({
    target: API_PROXY,
    secure: false
  })
);
app.use(
  '/files/',
  proxy({
    target: API_PROXY,
    secure: false
  })
);

// Pass the Parcel bundler into Express as middleware
app.use(bundler.middleware());

// Run your Express server
app.listen(PORT);
