import Logger from '@home-gallery/logger'

const log = Logger('cli.index.journal.apply')

const command = {
  command: ['apply'],
  describe: 'Apply file index journal to file index',
  builder: (yargs) => {
    return yargs.option({
      keep: {
        alias: 'keep-journal',
        boolean: true,
        describe: 'Do not remove journal file',
      },
    })
  },
  handler: (argv) => {
    const run = async () => {
      const { applyJournal } = await import('@home-gallery/index');

      const indexFilename = argv.index
      const options = {
        dryRun: argv.dryRun,
        journal: argv.journal,
        keepJournal: argv.keepJournal
      }

      await applyJournal(indexFilename, options)
      return indexFilename
    }

    run()
      .then(indexFilename => {
        log.info(`File index ${indexFilename} is updated`)
      })
      .catch(err => {
        log.error(err, `Failed to apply file index journal: ${err}`)
        process.exit(1)
      })
  }
}

export default command
