const debug = require('debug')('cli:index');

const command = {
  command: 'index',
  describe: 'Create or update file index',
  builder: (yargs) => {
    return yargs.option({
      index: {
        alias: 'i',
        describe: 'File index filename',
        default: 'index.idx'
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
      'add-limits': {
        describe: `Limits of new index files for incremental imports. Format is initial,add?,factor?,max? eg. 200,500,1.25,8000`
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
    const { update, matcherFns } = require('./index');

    const options = {
      checksum: argv.checksum,
      exclude: argv.exclude,
      excludeFromFile: argv['exclude-from-file'],
      excludeIfPresent: argv['exclude-if-present'],
      dryRun: argv['dry-run'],
      matcherFn: matcherFns[argv.m] || matcherFns['size-ctime-inode'],
      addLimits: argv.addLimits
    }
    update(argv.directory, argv.index, options, (err, _, limitExceeded) => {
      process.exit(err ? 2 : (limitExceeded ? 1 : 0))
    })
  }
}

const stats = (indexFilename, cb) => {
  const { statIndex, prettyPrint } = require('./stat');

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
