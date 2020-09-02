const debug = require('debug')('cli:extract');

const command = {
  command: 'extract',
  describe: 'Extract meta data and calculate preview files',
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
      exclude: {
        alias: 'e',
        array: true,
        describe: 'Exclude gitignore pattern'
      },
      'exclude-from-file': {
        alias: 'E',
        describe: 'Exclude gitignore patterns from file'
      },
      'checksum-from': {
        alias: 'C',
        describe: 'Only entries with newer sha1 checksum date in ISO 8601 format'
      }
    })
    .demandOption(['index', 'storage'])
  },
  handler: (argv) => {
    const extract = require('./index');
    const { fileFilter } = require('@home-gallery/common');

    const t0 = Date.now();
    fileFilter(argv.exclude, argv['exclude-from-file'], (err, fileFilterFn) => {
      if (err) {
        debug(err);
      } else {
        extract(argv.index, argv.storage, fileFilterFn, argv['checksum-from'], (err, count) => {
          if (err) {
            debug(`Could not extract all meta data and preview files: ${err}`);
          } else {
            debug(`Extract all meta data and calculated all preview files from ${count} entries in ${Date.now() - t0}ms`);
          }
        })
      }
    })
  }
}

module.exports = command;
