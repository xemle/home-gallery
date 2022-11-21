const { load } = require('../config')
const { runner } = require('./menu')

const command = {
  command: ['interactive', '$0'],
  describe: 'Interactive menu',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
    })
  },
  handler: (argv) => {
    const run = async (config) => {
      const options = await load(config)
      return runner('main', options)
    }

    run(argv.config)
      .then(result => result == 'exit' && console.log('Have a good day...'))
      .catch(err => console.log(`Error: ${err}`))
  }
}

module.exports = command
