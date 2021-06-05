const fs = require('fs/promises')

const initExampleConfig = async (options, err) => {
  const fallback = options.configFallback

  return fs.access(fallback)
    .then(() => {
      console.log(`Init configuration from ${fallback}`)
      return fs.copyFile(fallback, 'gallery.config.yml')
    }).then(() => {
      options.configFile = 'gallery.config.yml'
      return fs.readFile(options.configFile, 'utf8')
    }, () => Promise.reject(new Error(`Could not read configuration file '${options.configFile}': ${err}`)))
}

module.exports = { initExampleConfig }
