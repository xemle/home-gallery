const path = require('path')

const { loadConfig } = require('./config')
const { startServer, importSources } = require('./tasks')

const galleryDir = path.dirname(process.argv[1])

const config = (argv) => {
  const options = {
    configFile: argv.config,
    configFallback: path.join(galleryDir, 'gallery.config-example.yml')
  }
  return loadConfig(options)
}

const runServer = options => {
  console.log(`Starting server`)
  return startServer(options.config)
}

const runImport = (config, initialImport, incrementalUpdate) => {
  const sources = config.sources.filter(source => !source.offline)

  console.log(`Import online sources from: ${sources.map(source => source.dir)}`)
  return importSources(config, sources, initialImport, incrementalUpdate)
}

const command = {
  command: 'run',
  describe: 'Run common tasks',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        default: 'gallery.config.yml',
        describe: 'Configuration file'
      },
    })
    .command(
      'server',
      'Start the webserver',
      (yargs) => yargs,
      (argv) => config(argv)
          .then(runServer)
          .then(() => console.log(`Have a good day...`))
          .catch(err => console.log(`Error: ${err}`))
      )
    .command(
      'import',
      'Import and update new files from sources',
      (yargs) => yargs.option({
        initial: {
          alias: 'i',
          boolean: true,
          describe: 'Run initial incremental import'
        },
        update: {
          alias: 'u',
          boolean: true,
          describe: 'Check and import new files'
        },
      }),
      (argv) => config(argv)
          .then(options => runImport(options.config, argv.initial, argv.update))
          .then(() => console.log(`Have a good day...`))
          .catch(err => console.log(`Error: ${err}`))
      )
    .demandCommand()
  },
  handler: () => false
}

module.exports = command
