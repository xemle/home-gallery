const os = require('os')
const process = require('process')
const fs = require('fs/promises')
const path = require('path')

const log = require('@home-gallery/logger')('cli.run')

const { initConfig, defaultConfigFile, load } = require('./config')
const { startServer, importSources } = require('./tasks')

const galleryDir = path.dirname(process.argv[1])

const createConfig = async argv => {
  const sourceConfigFile = path.join(galleryDir, 'gallery.config-example.yml')
  let { config: configFile, source, force } = argv

  configFile = configFile || defaultConfigFile

  const exists = await fs.access(configFile).then(() => true).catch(() => false)
  if (exists && !force) {
    log.warn(`Configuration file ${configFile} already exists. Use --force to overwrite`)
    return
  }

  return initConfig(configFile, sourceConfigFile, source)
}

const runServer = options => {
  log.info(`Starting server`)
  return startServer(options)
}

const runImport = (config, initialImport, incrementalUpdate, smallFiles) => {
  const sources = config.sources.filter(source => !source.offline)

  log.info(`Import online sources from: ${sources.map(source => source.dir)}`)
  return importSources(config, sources, initialImport, incrementalUpdate, smallFiles)
}

const command = {
  command: 'run',
  describe: 'Run common tasks',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
    })
    .command(
      'init',
      'Initialize the gallery configuration',
      (yargs) => yargs
        .option({
          source: {
            alias: 's',
            array: true,
            required: true,
            description: 'Initial source directory or directories'
          },
          force: {
            alias: 'f',
            boolean: true,
            description: 'Force, overwrite existing configuration'
          }
        }),
      (argv) => createConfig(argv)
          .catch(err => log.error(err, `Error: ${err}`))
      )
    .command(
      'server',
      'Start the webserver',
      (yargs) => yargs,
      (argv) => load(argv.config, true)
          .then(runServer)
          .then(() => log.info(`Have a good day...`))
          .catch(err => log.error(err, `Error: ${err}`))
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
        'small-files': {
          alias: 's',
          boolean: true,
          describe: 'Import only small files up to 20MB to exclude big files such as videos to speed up the initial import'
        },
      }),
      (argv) => load(argv.config, true)
          .then(options => runImport(options.config, argv.initial, argv.update, argv.smallFiles))
          .then(() => log.info(`Have a good day...`))
          .catch(err => log.error(err, `Error: ${err}`))
      )
    .demandCommand()
  },
  handler: () => false
}

module.exports = command
