import Logger from '@home-gallery/logger'

import { load, mapArgs, validatePaths } from './config/index.js'

const log = Logger('cli.database')

const command = {
  command: 'database',
  describe: 'Database commands',
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
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
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
        }),
      (argv) => {
        const argvMapping = {
          index: 'fileIndex.files',
          journal: 'fileIndex.journal',
          storage: 'storage.dir',
          database: 'database.file',
          exclude: 'database.excludes',
          excludeFromFile: 'database.excludeFromFile',
        }

        const databaseDefaults = {
          supportedTypes: ['image', 'rawImage', 'video'],
          updated: new Date().toISOString()
        }

        const setDefaults = (config) => {
          const withOfflineSources = !config.fileIndex?.journal
          config.fileIndex = {
            files: config.sources?.filter(s => withOfflineSources || !s.offline).map(s => s.index),
            ...config.fileIndex
          }
          config.database = {
            ...databaseDefaults,
            ...config.database,
          }
        }

        const run = async() => {
          const { buildDatabase } = await import('@home-gallery/database')

          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, argvMapping)
          setDefaults(options.config)
          validatePaths(options.config, ['fileIndex.files', 'storage.dir', 'database.file'])

          return buildDatabase(options)
        }

        const t0 = Date.now();
        return run()
          .then(count => {
            log.info(t0, `Created database with ${count} entries`)
          })
          .catch(err => {
            if (err?.code == 'ENOCHANGE') {
              return log.info(`Database unchanged: ${err?.message}`)
            }
            log.error(err, `Could not build catalog database: ${err}`)
            process.exit(1)
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

        const mapping = {
          database: 'database.file',
          events: 'events.file'
        }

        const run = async () => {
          const { buildDatabase } = await import('@home-gallery/export-static')
          const { writeDatabase } = await import('@home-gallery/database')
          const { promisify } = await import('@home-gallery/common')

          const asyncBuildDatabase = promisify(buildDatabase)
          const asyncWriteDatabase = promisify(writeDatabase)

          const query = argv.keep ? argv.query : `not ( ${argv.query} )`
          const options = await load(argv.config, false)
          mapArgs(argv, options.config, mapping)

          const t0 = Date.now();
          log.info(`Rewriting database by ${argv.keep ? 'keeping' : 'removing'} entries with matching query '${argv.query}'`)
          return asyncBuildDatabase(options.config.database.file, options.config.events.file, query)
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

        return run()
          .catch(err => {
            log.error(err, `Failed to rewrite database: ${err}`)
            process.exit(1)
          })
      }
    )
  }
}

export default command;
