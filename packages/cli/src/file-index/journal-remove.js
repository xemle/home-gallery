import Logger from '@home-gallery/logger'

const log = Logger('cli.index.journal.apply')

const command = {
  command: ['remove'],
  describe: 'Remove file index journal',
  builder: (yargs) => yargs,
  handler: (argv) => {
    const run = async () => {
      const { removeJournal } = await import('@home-gallery/index');

      const indexFilename = argv.index
      const options = {
        dryRun: argv.dryRun,
        journal: argv.journal
      }

      return removeJournal(indexFilename, options)
    }

    run()
      .catch(err => {
        log.error(err, `Failed to remove file index journal: ${err}`)
        process.exit(1)
      })
  }
}

export default command
