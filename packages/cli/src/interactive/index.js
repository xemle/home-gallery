const path = require('path');

const galleryDir = path.dirname(process.argv[1])

const { loadConfig } = require('../config')
const { runner } = require('./menu')

const command = {
  command: ['interactive', '$0'],
  describe: 'Interactive menu',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        default: 'gallery.config.yml',
        describe: 'Configuration file'
      },
    })
  },
  handler: (argv) => {
    const options = {
      configFile: process.env['GALLERY_CONFIG'] || argv.config,
      configFallback: path.join(galleryDir, 'gallery.config-example.yml')
    }
    loadConfig(options)
      .then(options => runner('main', options.config))
      .then(result => result == 'exit' && console.log('Have a good day...'))
      .catch(err => console.log(`Error: ${err}`))
  }
}

module.exports = command
