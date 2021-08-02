const log = require('@home-gallery/logger')('cli.database')

const command = {
  command: 'database',
  describe: 'Build database from file indices, extracted meta data and preview files from the storage',
  builder: (yargs) => {
    return yargs.option({
      index: {
        alias: 'i',
        array: true,
        describe: 'File index'
      },
      storage: {
        alias: 's',
        describe: 'Storage directory'
      },
      database: {
        alias: 'd',
        describe: 'Database filename'
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
    .demandOption(['index', 'storage', 'database'])
  },
  handler: (argv) => {
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
          supportedTypes: ['image', 'rawImage', 'video']
        }
        buildDatabase(argv.index, argv.storage, argv.database, options, (err, database) => {
          if (err && err.code == 'ENOCHANGE') {
            log.infor(`Database unchanged: ${err}`);
          } else if (err) {
            log.error(`Could not build catalog database: ${err}`);
          } else {
            log.info(t0, `Build catalog database ${argv.database} with ${database.data.length} entries`);
          }
        })
      }
    })
  }
}

module.exports = command;
