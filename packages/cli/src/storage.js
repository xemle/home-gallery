const log = require('@home-gallery/logger')('cli.storage')

const command = {
  command: 'storage',
  describe: 'Storage utils',
  builder: (yargs) => {
    return yargs.option({
      storage: {
        require: true,
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
            require: true,
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

        const storageDir = argv.storage
        const databaseFilename = argv.database
        const indexFilenames = argv.index || []
        const options = {
          dryRun: argv.dryRun
        }
        purgeOrphanFiles(storageDir, databaseFilename, indexFilenames, options)
          .catch(err => log.error(err, `Error: ${err}`))
      }
    )
    .demandCommand()
  },
  handler: () => false
}

module.exports = command
