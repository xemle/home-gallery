const os = require('os')
const path = require('path')
const { fetchRemote } = require('@home-gallery/fetch')

const log = require('@home-gallery/logger')('cast')

const { scanFirst } = require('./scanner')
const { slideshow } = require('./player')
const { proxy } = require('./proxy')
const { getPreview } = require('./utils')

const defaultProxyPort = 38891

const getIp = () => {
  const interfaces = os.networkInterfaces()
  const ips = Object.values(interfaces)
    .reduce((r, l) => r.concat(l), [])
    .filter(interface => interface.family == 'IPv4' && !interface.internal)
    .map(interface => interface.address)
  log.debug(`Found IPs: ${ips.join(', ')}`)
  return ips.shift()
}

const createSessionId = len => {
  let s = ''
  while (s.length < len) {
    const c = String.fromCharCode((Math.random() * 255).toFixed())
    if (c.match(/[-A-Za-z0-9]/)) {
      s += c
    }
  }
  return s
}

const byDate = reverse => {
  const reverseFactor = reverse ? -1 : 1
  return (a, b) => {
    if (a.date < b.date) {
      return -1 * reverseFactor
    } else if (a.date > b.date) {
      return 1 * reverseFactor
    }
    return 0
  }
}

const extractMedia = (entries, maxPreviewSize, baseUrl) => {
  return entries.reduce((result, entry) => {
    const image = getPreview(entry, 'image', maxPreviewSize) || getPreview(entry, 'image')
    const title = path.parse(entry.files[0].filename).name
    if (entry.type == 'video') {
      const video = getPreview(entry, 'video', maxPreviewSize) || getPreview(entry, 'video')
      if (image && video) {
        result.push({
          type: 'video',
          title,
          video: `${baseUrl}/files/${video}`,
          image: `${baseUrl}/files/${image}`,
          toString: function() {
            const firstFile = entry.files[0]
            return `${entry.id.slice(0, 7)}:${firstFile.index}:${firstFile.filename}, url ${this.video}`
          }
        })
      }
    } else if (image) {
      result.push({
        type: 'image',
        title,
        image: `${baseUrl}/files/${image}`,
        toString: function () {
          const firstFile = entry.files[0]
          return `${entry.id.slice(0, 7)}:${firstFile.index}:${firstFile.filename}, url ${this.image}`
      }
      })
    }
    return result
  }, [])
}

const cast = async ({serverUrl, query, useProxy, proxyIp, port, insecure, random, reverse, delay, maxPreviewSize} = {}) => {
  const [database, device] = await Promise.all([
    fetchRemote(serverUrl, {query, insecure}),
    scanFirst(10 * 1000)
  ])

  let baseUrl = serverUrl
  if (useProxy) {
    proxyIp = proxyIp || getIp()
    port = port || defaultProxyPort
    const sessionId = createSessionId(16)
    await proxy({serverUrl, host: proxyIp, port, sessionId})

    baseUrl = `http://${proxyIp}:${port}/${sessionId}`
    log.info(`Started HTTP file proxy ${baseUrl}`)
  }

  const entries = extractMedia(database.data.sort(byDate(reverse)), maxPreviewSize || 1920, baseUrl)
  log.info(`Start slideshow to device ${device.name} at ${device.host} with ${entries.length} entries`)
  await slideshow(device.host, entries, { random, delay })
}

module.exports = {
  cast,
  scanFirst,
  slideshow,
  defaultProxyPort
}