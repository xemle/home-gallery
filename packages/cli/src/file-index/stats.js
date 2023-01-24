const log = require('@home-gallery/logger')('cli.index.stats')

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
    const { statIndex, prettyPrint } = require('@home-gallery/index');
  
    const indexFilename = argv.index;
    statIndex(indexFilename, (err, stats) => {
      if (err) {
        log.error(err, `Could not read file index ${indexFilename}: ${err}`);
        return cb(err);
      }
      console.log(prettyPrint(stats));
      cb(null, stats);
    })
  }
}

module.exports = command
