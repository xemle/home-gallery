const fs = require('fs');
const path = require('path');

const log = require('@home-gallery/logger')('server.webapp')

const { useIf, isIndex } = require('./utils')

const injectStateMiddleware = (indexFile, getFirstEntries, count) => {
  return (_, res) => {
    fs.readFile(indexFile, 'utf8', (err, data) => {
      if (err) {
        log.error(err, `Could not read index file ${indexFile}`)
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

const app = (webappDir, getFirstEntries, count) => {
  const indexFile = path.resolve(webappDir, 'index.html')
  const injectState = injectStateMiddleware(indexFile, getFirstEntries, count)
  return [
    useIf(injectState, isIndex),
    (_, res) => res.sendFile(indexFile)
  ];
}

module.exports = app;
