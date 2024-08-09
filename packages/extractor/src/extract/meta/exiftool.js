import { ExifTool } from 'exiftool-vendored';

import Logger from '@home-gallery/logger'

const log = Logger('extractor.image.exif');

import { getNativeCommand } from '../utils/native-command.js'

const exifSuffix = 'exif.json';

const exifTypes = ['image', 'rawImage', 'video', 'meta']

/**
 * @typedef {import('exiftool-vendored').ExifTool} ExifTool
 */
/**
 *
 * @param {*} config
 * @returns {Promise<ExifTool>}
 */
const initExiftool = async config => {
  const exiftoolOptions = {
    taskTimeoutMillis: 5000
  }
  if (config?.extractor?.useNative?.includes('exiftool')) {
    log.debug(`Use native system command exiftool`)
    exiftoolOptions.exiftoolPath = getNativeCommand('exiftool')
  }

  return new Promise((resolve, reject) => {
    const exiftool = new ExifTool(exiftoolOptions)
    if (!exiftool) {
      return reject(new Error(`Could not initiate exiftool with options: ${JSON.stringify(exiftoolOptions)}`))
    }
    exiftool.version()
      .then(version => {
        log.debug(`Use exiftool version ${version}`)
        resolve(exiftool)
      })
      .catch(err => {
        return reject(new Error(`Failed to read exiftool version: ${err}`))
      })
   })
}

/**
 * @param {import('@home-gallery/types').TStorage} storage
 * @param {ExifTool} exifTool
 * @returns {import('stream').Transform}
 */
function exif(storage, exifTool) {
  /**
   * @param {import('@home-gallery/types').TExtractorEntry} entry
   * @returns {boolean}
   */
  const test = entry => exifTypes.includes(entry.type) && !storage.hasFile(entry, exifSuffix)

  /**
   * @param {import('@home-gallery/types').TExtractorEntry} entry
   * @param {callback} cb
   */
  const task = async (entry) => {
    const src = await entry.getFile();

    const t0 = Date.now();
    return exifTool.read(src)
      .then(tags => storage.writeFile(entry, exifSuffix, tags))
      .then(() => {
        log.debug(t0, `Extracted exif data from ${entry}`);
      })
      .catch(err => {
        log.error(err, `Could not write exif data for ${entry}: ${err}`)
      })
  }

  return {
    test,
    task
  }
}

const tearDownExifTool = async (exifTool) => {
  return exifTool.end()
    .then(() => {
      log.debug(`Close exiftool`)
    })
    .catch(err => {
      log.warn(err, `Could not close exiftool: ${err}`);
    })
}

/**
 * @param {import('@home-gallery/types').TPluginManager} manager
 * @returns {import('@home-gallery/types').TExtractor}
 */
export const exifPlugin = manager => ({
  name: 'exif',
  phase: 'meta',
  /**
   * @param {import('@home-gallery/types').TStorage} storage
   */
  async create(storage) {
    const config = manager.getConfig()
    const exifTool = await initExiftool(config)
    manager.getContext().exifTool = exifTool
    return exif(storage, exifTool)
  },
  async tearDown() {
    const context = manager.getContext()
    if (!context?.exifTool) {
      return
    }
    const exifTool = context.exifTool
    context.exifTool = null
    return tearDownExifTool(exifTool)
  }
})
