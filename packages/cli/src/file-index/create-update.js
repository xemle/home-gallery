import Logger from '@home-gallery/logger'

const log = Logger('cli.index.update')

const command = {
  command: ['$0', 'create', 'update'],
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
        alias: 'C',
        boolean: true,
        default: true,
        describe: 'Create file checksums'
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
      'max-filesize': {
        string: true,
        describe: `Limit files up to given filesize. Example values are 2096, 5M or 0.2G. See also option --keep-known`
      },
      'keep-known': {
        boolean: true,
        default: true,
        describe: `Keep known files if option --max-filesize is used, even if they have larger size. If set to false, remove larger files from index`
      },
      'add-limits': {
        string: true,
        describe: `Limits of new index files for incremental imports. Format is initial,add?,factor?,max?. Eg. 200,500,1.25,8000`
      },
      'journal': {
        alias: 'j',
        string: true,
        describe: `Create index journal with given id`
      },
    })
    .demandOption(['index', 'directory'])
  },
  handler: (argv) => {
    const run = async () => {
      const { update, matcherFns } = await import('@home-gallery/index');

      const options = {
        checksum: argv.checksum,
        exclude: argv.exclude,
        excludeFromFile: argv['exclude-from-file'],
        excludeIfPresent: argv['exclude-if-present'],
        dryRun: argv['dry-run'],
        matcherFn: matcherFns[argv.m] || matcherFns['size-ctime-inode'],
        maxFilesize: argv.maxFilesize,
        keepKnownFiles: argv.keepKnown,
        addLimits: argv.addLimits,
        journal: argv.journal
      }

      const [_, __, limitExceeded] = await update(argv.directory, argv.index, options)
      return limitExceeded
    }

    run()
      .then(limitExceeded => {
        if (limitExceeded) {
          log.info(`File limit exceeded on file index update`)
          process.exit(1)
        }
      })
      .catch(err => {
        if (err && err.code == 'EUSERABORT') {
          log.warn(`Index creation aborted: ${err}`)
        } else if (err) {
          log.error(err, `Failed to update file index: ${err}`)
        }
        process.exit(2)
      })
  }
}

export default command
