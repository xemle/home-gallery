const fs = require('fs');
const path = require('path');
const express = require('express');

const isIndex = path => path === '/' || path === '/index.html';

const injectState = (indexFile, getFirstEntries, count) => {
  return (req, res, next) => {
    if (!isIndex(req.path)) {
      return next();
    }

    fs.readFile(indexFile, 'utf8', (err, data) => {
      if (err) {
        return res.status(404).json({error: `${err}`});
      }
      const state = {
        entries: getFirstEntries(count)
      }
      data = data.replace('window.__homeGallery={}', `window.__homeGallery=${JSON.stringify(state)}`)
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': data.length,
      })
      res.send(data);
    })
  }
}

const app = (webappDir, getEntries, count) => {
  const indexFile = path.resolve(webappDir, 'index.html')
  return [
    injectState(indexFile, getEntries, count),
    express.static(webappDir),
    (_, res) => res.sendFile(indexFile)
  ];
}

module.exports = app;
