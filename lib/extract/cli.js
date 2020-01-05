const debug = require('debug')('cli:extract');

const extract = require('./index');

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
      }
    })
    .demandOption(['index', 'storage'])
  },
  handler: (argv) => {
    const t0 = Date.now();
    extract(argv.index, argv.storage, (err, count) => {
      if (err) {
        debug(`Could not extract all meta data and preview files: ${err}`);
      } else {
        debug(`Extract all meta data and calculated all preview files from ${count} entries in ${Date.now() - t0}ms`);
      }
    })
  }
}

module.exports = command;
