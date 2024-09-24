import Logger from '@home-gallery/logger'

const log = Logger('cli.index.journal')

const command = {
  command: 'journal',
  describe: 'Journal operations',
  builder: (yargs) => {
    return yargs.option({
      index: {
        alias: 'i',
        describe: 'File index filename',
        default: 'index.idx'
      },
      journal: {
        alias: 'j',
        describe: 'Journal identifier',
      },
      remove: {
        alias: 'r',
        boolean: true,
        describe: 'Removes the journal'
      }
    })
    .demandOption(['index', 'journal'])
  },
  handler: (argv) => {
    const indexFilename = argv.index;
    const journal = argv.journal;
    const remove = argv.remove;

    if (!remove) {
      log.info('Only remove option is currentyl supported. Nothing to do')
      return
    }

    const run = async () => {
      const { removeJournal } = await import('@home-gallery/index')

      return new Promise((resolve, reject) => {
        removeJournal(indexFilename, journal, err => err ? reject(err) : resolve())
      })
    }

    run()
      .then(() => {
        log.info(`Removed journal ${journal} from file index ${indexFilename}`)
      })
      .catch(err => {
        log.warn(err, `Could not remove journal ${journal} from file index ${indexFilename}: ${err}`)
      })
  }
}

export default command
