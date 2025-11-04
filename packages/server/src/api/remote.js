import express from 'express'
import fetch from 'node-fetch'
import Logger from '@home-gallery/logger'
import { remoteDb } from '../remote-source.js'

const log = Logger('server.api.remote')

let remoteSourcesMap = {} // hash -> baseURL

export default async function remoteApi(context) {
  const { router, config } = context
  log.info(`remoteApi() called with router and config`)

  // populate remoteSourcesMap from config
  if (config.remoteSources?.length) {
    log.info(`Found ${config.remoteSources.length} remote sources in config`)
    for (const src of config.remoteSources) {
      remoteSourcesMap[src.name] = src.url
      log.info(`Registered remote source: name='${src.name}' url='${src.url}'`)
    }
  } else {
    log.info(`No remote sources configured`)
  }

  const remoteRouter = express.Router()
  log.info(`Created remoteRouter`)

  remoteRouter.use((req, res) => {
    log.info(`Incoming request to remoteRouter: ${req.method} ${req.originalUrl}`)
    log.info(`req.path = '${req.path}'`)

    const parts = req.path.substring(1).split('/').map(decodeURIComponent)
    log.info(`Parsed path parts: ${JSON.stringify(parts)}`)

    const hash = parts.shift()
    log.info(`Extracted hash: '${hash}'`)
    const rest = parts.join('/')
    log.info(`Remaining path (rest): '${rest}'`)

	const baseUrl =
	  remoteSourcesMap[hash] ||
	  Object.entries(remoteSourcesMap).find(([k]) => k.toLowerCase().startsWith(hash.toLowerCase()))?.[1]

    if (!baseUrl) {
      log.warn(`Unknown remote source hash: '${hash}'`)
      return res.status(404).send(`Unknown remote source hash: ${hash}`)
    }

    const remoteUrl = `${baseUrl.replace(/\/$/, '')}/files/${rest.replace(/^\/+/, '')}`

    log.info(`Proxying remote request to: ${remoteUrl}`)

    fetch(remoteUrl).then(response => {
      log.info(`Received response from remote: status=${response.status}`)
      if (!response.ok) {
        log.warn(`Remote response not ok: ${response.statusText}`)
        return res.status(response.status).send(`Failed to fetch remote file: ${response.statusText}`)
      }

      response.headers.forEach((value, key) => {
        res.setHeader(key, value)
        log.info(`Set header: ${key} = ${value}`)
      })
      log.info(`Piping remote response body to client`)
      response.body.pipe(res)
    }).catch(err => {
      log.error(err, `Error fetching remote file from ${remoteUrl}`)
      res.status(500).send(`Error fetching remote file`)
    })
  })

  router.use('/remote', remoteRouter)
  log.info(`Mounted remoteRouter on '/remote'`)
}
