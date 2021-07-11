const debug = require('debug')('cli:index:journal');

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
      debug('Only remove option is currentyl supported. Nothing to do')
      return
    }
    const { removeJournal } = require('@home-gallery/index')

    removeJournal(indexFilename, journal, (err) => {
      if (err) {
        debug(`Could not remove journal ${journal} from file index ${indexFilename}: ${err}`)
      }
    })
  }
}

module.exports = command
