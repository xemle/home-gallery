const log = require('@home-gallery/logger')('cli.database')

const command = {
  command: 'database',
  describe: 'Database commands',
  builder: (yargs) => {
    return yargs.option({
      database: {
        alias: 'd',
        describe: 'Database filename'
      }
    })
    .command(
      ['create', '$0'],
      'Create database from file indices, extracted meta data and preview files from the storage',
      (yargs) => yargs
        .option({
          index: {
            alias: 'i',
            array: true,
            describe: 'File index'
          },
          storage: {
            alias: 's',
            describe: 'Storage directory'
          },
          exclude: {
            alias: 'e',
            array: true,
            describe: 'Exclude gitignore pattern'
          },
          'exclude-from-file': {
            alias: 'E',
            describe: 'Exclude gitignore patterns from file'
          },
          journal: {
            string: true,
            describe: 'Journal id'
          }
        })
        .demandOption(['index', 'storage', 'database']),
      (argv) => {
        const { fileFilter } = require('@home-gallery/common');
        const { buildDatabase } = require('@home-gallery/database');

        const t0 = Date.now();
        fileFilter(argv.exclude, argv['exclude-from-file'], (err, fileFilterFn) => {
          if (err) {
            log.error(err);
          } else {
            const options = {
              fileFilterFn,
              journal: argv.journal,
              supportedTypes: ['image', 'rawImage', 'video'],
              updated: new Date().toISOString()
            }
            buildDatabase(argv.index, argv.storage, argv.database, options, (err, database) => {
              if (err && err.code == 'ENOCHANGE') {
                log.info(`Database unchanged: ${err}`);
              } else if (err) {
                log.error(`Could not build catalog database: ${err}`);
              } else {
                log.info(t0, `Build catalog database ${argv.database} with ${database.data.length} entries`);
              }
            })
          }
        })
      }
    )
    .command(
      ['remove'],
      'Remove entries by given query',
      (yargs) => yargs
        .option({
          events: {
            alias: 'e',
            describe: 'Events filename'
          },
          query: {
            alias: 'q',
            string: true,
            describe: 'Query to remove from the database'
          },
          keep: {
            alias: ['k', 'inverse'],
            boolean: true,
            describe: 'Keep matching entries instead of removing it',
          },
          'dry-run': {
            alias: 'n',
            describe: 'Do not perform any writes'
          },
          config: {
            alias: 'c',
            describe: 'Configuration file'
          },
        })
        .example('$0 database remove -q tag:trashed', 'Remove all entries with tag "trashed"')
        .example('$0 database remove -k -q tag:good', 'Keep all entries with tag "good"')
        .demandOption(['q']),
      (argv) => {
        const { buildDatabase } = require('@home-gallery/export')
        const { writeDatabase } = require('@home-gallery/database')
        const { promisify } = require('@home-gallery/common')

        const { load, mapArgs } = require('./config')

        const asyncBuildDatabase = promisify(buildDatabase)
        const asyncWriteDatabase = promisify(writeDatabase)

        const mapping = {
          database: 'database.file',
          events: 'events.file'
        }

        const run = async () => {
          const query = argv.keep ? argv.query : `not ( ${argv.query} )`
          const options = await load(argv.config, false)
          mapArgs(argv, options.config, mapping)

          const t0 = Date.now();
          log.info(`Rewriting database by ${argv.keep ? 'keeping' : 'removing'} entries with matching query '${argv.query}'`)
          return await asyncBuildDatabase(options.config.database.file, options.config.events.file, query)
            .then(database => {
              if (argv.dryRun) {
                log.debug(`Skip write of database due dry run`)
                return database
              }
              return asyncWriteDatabase(options.config.database.file, database.data)
            })
            .then(database => {
              log.info(t0, `Database rewritten with ${database.data?.length} entries to ${options.config.database.file}`)
            })
        }

        run()
          .catch(err => {
            log.error(err, `Failed to rewrite database: ${err}`)
            process.exit(1)
          })
      }
    )
  }
}

module.exports = command;
