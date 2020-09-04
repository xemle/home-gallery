const debug = require('debug')('cli:build');

const command = {
  command: 'build',
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
      }
    })
    .demandOption(['index', 'storage', 'database'])
  },
  handler: (argv) => {
    const { fileFilter } = require('@home-gallery/common');
    const { buildDatabase } = require('./index');

    const t0 = Date.now();
    fileFilter(argv.exclude, argv['exclude-from-file'], (err, fileFilterFn) => {
      if (err) {
        debug(`${err}`);
      } else {
        buildDatabase(argv.index, argv.storage, argv.database, fileFilterFn, (err, database) => {
          if (err) {
            debug(`Could not build catalog database: ${err}`);
          } else {
            debug(`Build catalog database ${argv.database} with ${database.data.length} entries in ${Date.now() - t0}ms`);
          }
        })
      }
    })
  }
}

module.exports = command;
