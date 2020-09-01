const debug = require('debug')('cli:index');

const { update, matcherFns } = require('./index');
const { statIndex, prettyPrint } = require('./stat');

const command = {
  command: 'index',
  describe: 'Create or update file index',
  builder: (yargs) => {
    return yargs.option({
      index: {
        alias: 'i',
        describe: 'File index filename',
        default: 'fs.idx'
      },
      directory: {
        alias: ['d', 'dir'],
        describe: 'Directory of file index',
        default: '.'
      },
      checksum: {
        alias: 'c',
        boolean: true,
        default: false,
        describe: 'Calculate file checksums'
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
      'dry-run': {
        alias: 'n',
        describe: 'Do not perform any writes'
      },
      'exclude-if-present': {
        alias: 'X',
        describe: 'Exclude files and directories if file is present'
      },
      'matcher': {
        alias: 'm',
        default: 'size-ctime-inode',
        describe: `File matcher for index merge by: size, size-ctime, size-ctime-inode`
      },
    })
    .demandOption(['index', 'directory'])
    .command(
      'stats',
      'Print index statistics', 
      (yargs) => yargs, 
      (argv) => {
        stats(argv.index, () => true)
      })
  },
  handler: (argv) => {
    const options = {
      checksum: argv.checksum,
      exclude: argv.exclude,
      excludeFromFile: argv['exclude-from-file'],
      excludeIfPresent: argv['exclude-if-present'],
      dryRun: argv['dry-run'],
      matcherFn: matcherFns[argv.m] || matcherFns['size-ctime-inode']
    }
    update(argv.directory, argv.index, options, () => true)
  }
}

const stats = (indexFilename, cb) => {
  statIndex(indexFilename, (err, stats) => {
    if (err) {
      debug(`Could not read file index ${indexFilename}: ${err}`);
      return cb(err);
    }
    console.log(prettyPrint(stats));
    cb(null, stats);
  })
}

module.exports = command
