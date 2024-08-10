import fs from 'fs/promises';
import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('server.webapp')

import { useIf, isIndex } from './utils.js'

const injectStateMiddleware = (indexFile, getState, {basePath, injectRemoteConsole}) => {

  const getIndex = async (req) => {
    const state = await getState(req)
    let html = await fs.readFile(indexFile, 'utf-8')

    if (basePath && basePath != '/') {
      html = html.replace('<base href="/">', `<base href="${basePath}">`)
    }
    if (injectRemoteConsole) {
      html = html.replace('</head>', '<script src="/remote-console.js"></script></head>')
    }
    html = html.replace('window.__homeGallery={}', `window.__homeGallery=${JSON.stringify(state)}`)

    return html
  }

  return (req, res) => {
    getIndex(req)
      .then(html => {
        res.set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache',
          'Content-Length': html.length,
        })
        res.send(html);
      })
      .catch(err => {
        log.error(err, `Could not read index file ${indexFile}: ${err}`)
        return res.status(404).json({error: `${err}`, message: `Failed to read index.html. Please see server logs for details`});
      })
  }
}

export const webapp = (webappDir, getState, options) => {
  const indexFile = path.resolve(webappDir, 'index.html')
  const injectState = injectStateMiddleware(indexFile, getState, options)
  return [
    useIf(injectState, isIndex),
    (_, res) => res.sendFile(indexFile)
  ];
}
