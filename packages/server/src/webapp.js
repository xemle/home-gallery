import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import Logger from '@home-gallery/logger'

const log = Logger('server.webapp')

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const indexFile = path.join(__dirname, 'public', 'index.html')

export async function webapp(context) {
  const { router } = context

  const readHtml = readFileCached(indexFile)

  router.use((req, res) => {
    readHtml()
      .then(html => inject(html, req))
      .then(html => {
        res.set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache',
        })
        res.send(html)
      })
      .catch(err => {
        log.error(err, `Could not read index file ${indexFile}: ${err}`)
        return res.status(404).json({error: `${err}`, message: `Failed to read index.html. Please see server logs for details`});
      })
  })
}

async function inject(html, req) {
  const { basePath, injectRemoteConsole, state } = req.webapp

  if (basePath && basePath != '/') {
    html = html.replace('<base href="/">', `<base href="${basePath}">`)
  }
  if (injectRemoteConsole) {
    html = html.replace('</head>', '<script src="/remote-console.js"></script></head>')
  }
  html = html.replace('window.__homeGallery={}', `window.__homeGallery=${JSON.stringify(state)}`)

  return html
}

function readFileCached(file, refreshMs = 10 * 1000) {
  let data = false
  let lastStatCache = false
  let lastStatTime = 0

  return async () => {
    if (data && (Date.now() - lastStatTime) < refreshMs) {
      return data
    }

    const stat = await fs.stat(file)
    const statCache = [stat.size, stat.ctimeMs, stat.dev, stat.ino].join(':')
    lastStatTime = Date.now()

    if (statCache == lastStatCache) {
      return data
    }

    data = await fs.readFile(file, 'utf8')
    lastStatCache = statCache
    return data
  }
}
