import Logger from '@home-gallery/logger'

const log = Logger('cli.index.stats')

const command = {
  command: 'stats',
  describe: 'Print index statistics',
  builder: (yargs) => {
    return yargs.option({
      index: {
        alias: 'i',
        describe: 'File index filename',
        default: 'index.idx'
      },
    })
    .demandOption(['index'])
  },
  handler: (argv) => {
    const indexFilename = argv.index;

    const run = async () => {
      const { statIndex, prettyPrint } = await import('@home-gallery/index');

      return new Promise((resolve, reject) => {
        statIndex(indexFilename, (err, stats) => {
          if (err) {
            return reject(err)
          }
          console.log(prettyPrint(stats))

          resolve(stats)
        })
      })
    }

    run()
      .then(() => {
        log.trace(`Read stats from index file ${indexFilename}`)
      })
      .catch(err => {
        log.error(err, `Could not read file index ${indexFilename}: ${err}`);
      })
  }
}

export default command
