import os from 'os'
import path from 'path'
import fs from 'fs/promises'

import Logger from '@home-gallery/logger'

const log = Logger('cli.config.find')

const isWindows = os.platform == 'win32'
const env = process.env
const cwd = path.resolve(process.cwd())
const homeDir = os.homedir() || cwd
const galleryDir = path.dirname(process.argv[1])

const configFiles = ['gallery.config.yml', 'gallery.config.json']

export const defaultConfigFilename = 'gallery.config.yml'
export const defaultConfigDir = isWindows ? path.join(homeDir, 'home-gallery', 'config') : path.join(homeDir, '.config', 'home-gallery')
export const defaultConfigFile = path.join(defaultConfigDir, defaultConfigFilename)
export const defaultCacheDir = isWindows ? path.join(homeDir, 'home-gallery') : path.join(homeDir, '.cache')

const expandFiles = (dir, configPrefix = '') => configFiles.map(file => path.join(dir, `${configPrefix}${file}`))

export const findConfig = async () => {
  const lookupFiles = [
    ...(env.GALLERY_CONFIG ? [env.GALLERY_CONFIG] : []),
    ...(env.GALLERY_CONFIG_DIR ? expandFiles(env.GALLERY_CONFIG_DIR) : []),
    ...expandFiles(cwd),
    ...expandFiles(galleryDir),
    ...expandFiles(defaultConfigDir),
    ...expandFiles(homeDir, '.'),
    ...(!isWindows ? expandFiles(path.resolve('/', 'etc')) : [])
  ]
  log.trace(`Lookup configuration in ${lookupFiles.join(', ')}`)

  for (const file of lookupFiles) {
    const exists = await fs.access(file).then(() => true).catch(() => false)
    if (exists) {
      log.debug(`Found configuration at ${file}`)
      return file
    }
  }

  throw new Error(`Could not find a gallery configuration file`)
}
