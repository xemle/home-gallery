const os = require('os')
const path = require('path')
const fs = require('fs/promises')

const log = require('@home-gallery/logger')('cli.config.find')

const isWindows = os.platform == 'win32'
const env = process.env
const cwd = path.resolve(process.cwd())
const homeDir = os.homedir() || cwd
const galleryDir = path.dirname(process.argv[1])

const configFiles = ['gallery.config.yml', 'gallery.config.json']

const defaultConfigFilename = 'gallery.config.yml'
const defaultConfigDir = isWindows ? path.join(homeDir, 'home-gallery', 'config') : path.join(homeDir, '.config', 'home-gallery')
const defaultConfigFile = path.join(defaultConfigDir, defaultConfigFilename)
const defaultCacheDir = isWindows ? path.join(homeDir, 'home-gallery') : path.join(homeDir, '.cache')

const expandFiles = (dir, configPrefix = '') => configFiles.map(file => path.join(dir, `${configPrefix}${file}`))

const findConfig = async () => {
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

module.exports = {
  findConfig,
  defaultConfigFilename,
  defaultConfigDir,
  defaultConfigFile,
  defaultCacheDir
}