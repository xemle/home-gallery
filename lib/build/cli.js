const debug = require('debug')('cli:build');

const fileFilter = require('../utils/file-filter');

const build = require('./index');

const command = {
  command: 'build',
  describe: 'Create catalog database from file index, extracted meta data and preview files',
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
    const t0 = Date.now();
    fileFilter(argv.exclude, argv['exclude-from-file'], (err, fileFilterFn) => {
      if (err) {
        debug(`${err}`);
      } else {
        build(argv.index, argv.storage, argv.database, fileFilterFn, (err, database) => {
          if (err) {
            debug(`Could not build catalog database: ${err}`);
          } else {
            debug(`Build catalog database ${argv.database} with ${database.media.length} entries in ${Date.now() - t0}ms`);
          }
        })
      }
    })
  }
}

module.exports = command;
