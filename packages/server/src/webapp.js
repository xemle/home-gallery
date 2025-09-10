import fs from 'fs/promises'
import path from 'path'
import Logger from '@home-gallery/logger'
const log = Logger('server.webapp')
const readFileCached = (file, refreshMs = 10 * 1000) => {
  let data = false
  let lastStatCache = false
  let lastStatTime = 0
  return async () => {
    if (data && (Date.now() - lastStatTime) < refreshMs) return data
    const stat = await fs.stat(file)
    const statCache = [stat.size, stat.ctimeMs, stat.dev, stat.ino].join(':')
    lastStatTime = Date.now()
    if (statCache == lastStatCache) return data
    data = await fs.readFile(file, 'utf8')
    lastStatCache = statCache
    return data
  }
}

const readDbCached = (dbFile, refreshMs = 10_000) => {
  let cache = null
  let lastMtime = 0
  let lastCheck = 0
  return async () => {
    const now = Date.now()
    if (cache && (now - lastCheck) < refreshMs) return cache
    lastCheck = now
    try {
      const stat = await fs.stat(dbFile)
      if (stat.mtimeMs <= lastMtime && cache) return cache
      const data = await fs.readFile(dbFile, 'utf8')
      cache = JSON.parse(data)
      lastMtime = stat.mtimeMs
      return cache
    } catch (e) {
      log.error(e, `Could not read database file ${dbFile}`)
      return cache || { data: [] }
    }
  }
}

const injectStateMiddleware = (indexFile, getState, {
  basePath = '/',
  injectRemoteConsole = false,
}) => {
  const readIndex = readFileCached(indexFile)
  return async (req, res) => {
    //console.log('[DEBUG] injectStateMiddleware called for', req.path)
    let html = await readIndex()
    const state = await getState(req) || {}
    if (basePath && basePath !== '/') {
      html = html.replace('<base href="/">', `<base href="${basePath}">`)
    }
    if (injectRemoteConsole) {
      html = html.replace('</head>', '<script src="/remote-console.js"></script></head>')
    }
    html = html.replace('window.__homeGallery={}', `window.__homeGallery=${JSON.stringify(state)}`)
    if (state.metaTags) {
      const match = req.path.match(/^\/view\/([a-f0-9]+)/)
      if (match) {
        const shortId = match[1]
        const db = state.db || { data: [] }
        const media = db.data?.find(m => m.id.startsWith(shortId))
        if (media) {
          const fullHash = media.filenameHash || media.id
          const availableSizes = (media.previews || [])
            .map(p => {
              const m = p.match(/-image-preview-(\d+)\.jpg$/)
              return m ? parseInt(m[1], 10) : null
            })
            .filter(s => s > 0)
          const largestSize = availableSizes.length > 0 ? Math.max(...availableSizes) : null
          let imageUrl = ''
          if (largestSize) {
            imageUrl = `${req.protocol}://${req.get('host')}${basePath.replace(/\/$/, '')}/files/${fullHash.slice(0,2)}/${fullHash.slice(2,4)}/${fullHash.slice(4)}-image-preview-${largestSize}.jpg`
          }
    
          const rawFilename = media.files?.[0]?.filename || media.originalFilename || 'Photo'
          const title = !state.metaTagsPath
            ? rawFilename.replace(/^.*\//, '')
            : rawFilename.replace(/^.*\/([^\/]+\/[^\/]+)$/, '$1')
          const themeColor = (media.vibrantColors?.[0]) || "#7289DA"
          const descriptionParts = [
            media.model && media.model !== 'unknown' ? media.model : null,
            media.iso > 0 ? `ISO/${media.iso}` : null,
            media.shutterSpeed > 0 ? `${media.shutterSpeed}s` : null,
            media.aperture > 0 ? `f/${media.aperture}` : null,
            media.focalLength > 0 ? `${media.focalLength}mm` : null
          ].filter(Boolean)
    
          const description = descriptionParts.join(' | ')
          const meta = `
			<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">
			<meta name="theme-color" content="${themeColor}">
			<meta property="og:title" content="${title}" />
			<meta property="og:description" content="${description}" />
			${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
			<meta property="og:type" content="article" />
			${imageUrl ? `<meta property="og:image:height" content="1920" />` : ''}
			`
          const headIndex = html.indexOf('<head>')
          if (headIndex !== -1) {
            html = html.slice(0, headIndex + '<head>'.length) + meta + '\n' + html.slice(headIndex + '<head>'.length)
          }
        }
      }
    }

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache',
      'Content-Length': Buffer.byteLength(html, 'utf8'),
    })
    res.send(html)
  }
}

export const webapp = (webappDir, getState, options = {}) => {
  const indexFile = path.resolve(webappDir, 'index.html')
  const dbFile = path.resolve(webappDir, '..', 'gallery.db')
  const appConfig = options.appConfig || {}
  return injectStateMiddleware(indexFile, getState, {
    ...options,
    dbFile,
    appConfig
  })
}