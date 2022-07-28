const fs = require('fs');
const path = require('path');

const log = require('@home-gallery/logger')('server.webapp')

const { useIf, isIndex } = require('./utils')

const injectStateMiddleware = (indexFile, getState, injectRemoteConsole) => {
  return (req, res) => {
    fs.readFile(indexFile, 'utf8', (err, data) => {
      if (err) {
        log.error(err, `Could not read index file ${indexFile}`)
        return res.status(404).json({error: `${err}`});
      }
      if (injectRemoteConsole) {
        data = data.replace('</head>', '<script src="/remote-console.js"></script></head>')
      }
      data = data.replace('window.__homeGallery={}', `window.__homeGallery=${JSON.stringify(getState(req))}`)
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': data.length,
      })
      res.send(data);
    })
  }
}

const app = (webappDir, getState, injectRemoteConsole) => {
  const indexFile = path.resolve(webappDir, 'index.html')
  const injectState = injectStateMiddleware(indexFile, getState, injectRemoteConsole)
  return [
    useIf(injectState, isIndex),
    (_, res) => res.sendFile(indexFile)
  ];
}

module.exports = app;
