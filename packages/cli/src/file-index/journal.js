import Logger from '@home-gallery/logger'

const log = Logger('cli.index.journal')

import apply from './journal-apply.js'
import remove from './journal-remove.js'

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
      },
      'dry-run': {
        alias: 'n',
        describe: 'Do not perform any writes'
      },      
    })
    .command(apply)
    .command(remove)
    .demandOption(['index', 'journal'])
  },
  handler: (argv) => {
    if (!argv.remove) {
      log.info('No option selects. use command: index journal apply or index journal remove')
    }
    log.info('Deprecated remove option. Use command: index journal remove')

    const run = async () => {
      const { removeJournal } = await import('@home-gallery/index')

      const indexFilename = argv.index
      const options = {
        dryRun: argv.dryRun,
        journal: argv.journal
      }
      return removeJournal(indexFilename, options)
    }

    run()
      .then(() => {
        log.info(`Removed file index journal ${journal} from file index ${indexFilename}`)
      })
      .catch(err => {
        log.warn(err, `Could not remove journal ${journal} from file index ${indexFilename}: ${err}`)
      })
  }
}

export default command
