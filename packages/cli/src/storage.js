const log = require('@home-gallery/logger')('cli.storage')

const command = {
  command: 'storage',
  describe: 'Storage utils',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
      'auto-config': {
        boolean: true,
        default: true,
        describe: 'Search for configuration on common configuration directories'
      },
      storage: {
        alias: 's',
        describe: 'Storage directory',
      },
    })
    .command(
      'purge',
      'Purge orphean storage files',
      (yargs) => yargs
        .option({
          database: {
            alias: 'd',
            describe: 'Database file',
          },
          index: {
            alias: 'i',
            array: true,
            describe: 'Optional index file',
          },
          'dry-run': {
            alias: 'n',
            boolean: true,
            describe: 'Do not perform any writes'
          },
        }),
      (argv) => {
        const { purgeOrphanFiles } = require('@home-gallery/storage')
        const { load, mapArgs, validatePaths } = require('./config')

        const argvMapping = {
          index: 'fileIndex.files',
          storage: 'storage.dir',
          dryRun: 'storage.dryRun',
          database: 'database.file',
        }

        const setDefaults = (config) => {
          if (!config.fileIndex?.files) {
            const files = config.sources?.map(source => source.index) || [];
            config.fileIndex = {
              ...config.fileIndex,
              files
            }
          }
        }

        const run = async () => {
          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, argvMapping)
          setDefaults(options.config)
          validatePaths(options.config, ['storage.dir', 'database.file'])

          return purgeOrphanFiles(options)
        }

        const t0 = Date.now();
        run()
          .then(() => {
            log.info(t0, 'Purged orphan files')
          })
          .catch(err => {
            log.error(err, `Failed to purge orphan files: ${err}`);
            process.exit(1)
          })
      }
    )
    .demandCommand()
  },
  handler: () => false
}

module.exports = command
