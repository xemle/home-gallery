import express from 'express'
import path from 'path'

import Logger from '@home-gallery/logger'
import { sendError } from './error/index.js'

const log = Logger('server.sources')

const staticConfig = {index: false, maxAge: '2h'}

export function getSourcesApi(config) {
  /** @type {{ndex: string, dir: string, offline?: boolean, downloadable?: boolean}[]} */
  const sources = config.sources || []

  const downloadableSources = sources
    .filter(source => source.downloadable && !source.offline)
    .map(({index, dir}) => {
      const basename = path.basename(index)
      const indexName = basename.replace(/\.[^.]+$/, '')
      return {indexName, dir}
    })

  const router = express.Router()
  router.get('/', (_, res) => {
    res.json({
      data: downloadableSources.map(({indexName}) => ({indexName, downloadable: true}))
    })
  })

  for (const downloadableSource of downloadableSources) {
    const { indexName, dir } = downloadableSource
    log.warn(`Enable source directory ${dir} at /${indexName} to access original files`)
    router.use(`/${indexName}`, express.static(dir, staticConfig))
  }

  router.use('/', (req, res) => {
    const pos = req.path.indexOf('/', 1)
    if (pos > 0) {
      const indexName = req.path.substring(1, pos)
      const filename = req.path.substring(pos + 1)
      return sendError(res, 404, `File ${filename} for index ${indexName} not found`)
    }
    return sendError(res, 404, `Resource not found`)
  })

  return router
}