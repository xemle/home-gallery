import request from 'request';

import Logger from '@home-gallery/logger'
import { parallel, noop } from '@home-gallery/stream';

import { conditionalAsyncTask } from '../../stream/task.js';
import { toPlugin } from '../pluginUtils.js';

const log = Logger('extractor.apiEntry');

const ERROR_THRESHOLD = 5
const PUBLIC_API_SERVER = 'https://api.home-gallery.org'
const DOCUMENATION_URL = 'https://docs.home-gallery.org'

const getEntryFileBySuffixes = (storage, entry, suffixes) => suffixes.find(suffix => storage.hasFile(entry, suffix));

const simpleFetch = async (options) => {
  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if (err) {
        return reject(err)
      } else if (res.statusCode < 200 || res.statusCode >= 300) {
        const err = new Error(`Request was not successful: ${res.statusCode}`)
        err.statusCode = res.statusCode
        return reject(err)
      }
      resolve({res, body})
    })
  })
  .then(async ({body}) => {
    try {
      return JSON.parse(body)
    } catch(err) {
      throw new Error(`Failed to parse response body as json`, {cause: err})
    }
  })
}

/**
 * @param {import('@home-gallery/types').TStorage} storage
 */
const apiServerEntry = (storage, {name, apiServerUrl, apiPath, imagePreviewSuffixes, entrySuffix, concurrent, timeout}) => {
  let currentErrors = 0;

  const test = entry => {
    if (currentErrors > ERROR_THRESHOLD) {
      return false;
    } else if (!getEntryFileBySuffixes(storage, entry, imagePreviewSuffixes) || storage.hasFile(entry, entrySuffix)) {
      return false;
    } else if (entry.type === 'image' || entry.type === 'rawImage') {
      return true;
    } else {
      return false;
    }
  }

  const task = async (entry) =>{
    const t0 = Date.now();
    const imagePreviewSuffix = getEntryFileBySuffixes(storage, entry, imagePreviewSuffixes);
    const buffer = await storage.readFile(entry, imagePreviewSuffix)

    const options = {
      url: `${apiServerUrl}${apiPath}`,
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: buffer,
      encoding: null,
      timeout: timeout * 1000,
    }
    const data = await simpleFetch(options)
    await storage.writeFile(entry, entrySuffix, data)
    log.debug(t0, `Fetched ${name} for ${entry}`);
  }

  const taskFacade = async (entry) => {
    return task(entry)
      .then(() => {
        if (currentErrors > 0) {
          currentErrors--
        }
      })
      .catch(err => {
        log.warn(err, `Failed to fetch ${name} for ${entry}: ${err}`)
        currentErrors++;
        if (currentErrors > ERROR_THRESHOLD) {
          log.warn(`Too many errors. Skip processing of ${name}`);
        }
      })
  }

  return parallel({task: conditionalAsyncTask(test, taskFacade), concurrent});
}

const apiServerPreviewSizeFilter = size => size <= 800

const isDisabled = (config, feature) => {
  const disable = config?.extractor?.apiServer?.disable || []
  if (Array.isArray(disable)) {
    return disable.includes(feature)
  }
  return disable == feature
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const apiServerPlugin = {
  name: 'apiServerMessage',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const {url, timeout, concurrent} = config?.extractor?.apiServer || {}

    if (url?.startsWith(PUBLIC_API_SERVER)) {
      log.warn(`You are using the public api server ${url}. Please read its documentation at ${DOCUMENATION_URL} for privacy concerns`)
    } else {
      log.debug(`Use api server ${url}`)
    }
    log.trace(`Use api server with ${concurrent} concurrent connections and timeout of ${timeout}s`)
    return noop()
  },
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const similarDetectionPlugin = {
  name: 'similarDetection',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const { storage, imagePreviewSizes, sizeToImagePreviewSuffix } = context
    if (isDisabled(config, 'similarDetection')) {
      log.info(`Disable similar detection`)
      return noop()
    }

    const apiServer = config.extractor.apiServer
    return apiServerEntry(storage, {
      name: 'similarity embeddings',
      apiServerUrl: apiServer.url,
      apiPath: '/embeddings',
      imagePreviewSuffixes: imagePreviewSizes.filter(apiServerPreviewSizeFilter).map(sizeToImagePreviewSuffix),
      entrySuffix: 'similarity-embeddings.json',
      concurrent: apiServer.concurrent,
      timeout: apiServer.timeout,
    })
  },
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const objectDetectionPlugin = {
  name: 'objectDetection',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const { storage, imagePreviewSizes, sizeToImagePreviewSuffix } = context
    if (isDisabled(config, 'objectDetection')) {
      log.info(`Disable object detection`)
      return noop()
    }

    const apiServer = config.extractor.apiServer
    return apiServerEntry(storage, {
      name: 'object detection',
      apiServerUrl: apiServer.url,
      apiPath: '/objects',
      imagePreviewSuffixes: imagePreviewSizes.filter(apiServerPreviewSizeFilter).map(sizeToImagePreviewSuffix),
      entrySuffix: 'objects.json',
      concurrent: apiServer.concurrent,
      timeout: apiServer.timeout,
    })
  },
}

/**
 * @type {import('@home-gallery/types').TExtractorPlugin}
 */
const faceDetectionPlugin = {
  name: 'faceDetection',
  phase: 'file',
  /**
   * @param {import('@home-gallery/types').TExtractorContext} context
   */
  async create(context, config) {
    const { storage, imagePreviewSizes, sizeToImagePreviewSuffix } = context
    if (isDisabled(config, 'faceDetection')) {
      log.info(`Disable face detection`)
      return noop()
    }

    const apiServer = config.extractor.apiServer
    return apiServerEntry(storage, {
      name: 'face detection',
      apiServerUrl: apiServer.url,
      apiPath: '/faces',
      imagePreviewSuffixes: imagePreviewSizes.filter(apiServerPreviewSizeFilter).map(sizeToImagePreviewSuffix),
      entrySuffix: 'faces.json',
      concurrent: apiServer.concurrent,
      timeout: apiServer.timeout,
    })
  },
}

const plugin = toPlugin([apiServerPlugin, similarDetectionPlugin, objectDetectionPlugin, faceDetectionPlugin], 'aiExtractor', ['imagePreviewExtractor'])

export default plugin