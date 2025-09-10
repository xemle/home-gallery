import { stat, statSync } from 'fs'
import path from 'path'

import express from 'express'

import Logger from '@home-gallery/logger'
import { sendError } from './error/index.js'

const log = Logger('server.sources')

const staticConfig = {index: false, maxAge: '2h'}

export function getSourcesApi(config) {
  /** @type {{index: string, dir: string, offline?: boolean, downloadable?: boolean}[]} */
  const sources = config.sources || []

  const downloadableSources = sources
    .filter(source => source.downloadable && !source.offline)
    .map(({index, dir}) => {
      const basename = path.basename(index)
      const indexName = basename.replace(/\.[^.]+$/, '')
      return {indexName, dir}
    })

  const indexNameToDir = downloadableSources.reduce((result, {indexName, dir}) => {
    result[indexName] = dir
    return result
  }, {})

  const router = express.Router()
  router.get('/', (_, res) => {
    res.json({
      data: downloadableSources.map(({indexName}) => ({indexName, downloadable: true}))
    })
  })

  router.use('/', createStaticIndex(indexNameToDir))

  return router
}

function createStaticIndex(indexNameToDir) {
  return (req, res) => {
    if (req.method != 'GET') {
      return sendError(res, 405, `Method is not allowed`)
    }

    const parts = req.path.substring(1).split('/').map(decodeURI)
    const indexName = parts.shift()
    const dir = indexNameToDir[indexName]

    if (!dir || !parts.length) {
      return sendError(res, 404, `File not found`)
    }

    const file = path.resolve(dir, ...parts)
    const filename = parts.join('/')
    stat(file, (err, stats) => {
      if (err || !stats.isFile()) {
        return sendError(res, 404, `File ${filename} for index ${indexName} not found`)
      }
      log.trace({indexName, dir, filename}, `Send original file ${filename} from index ${indexName}`)
      return res.sendFile(file)
    })
  }
}