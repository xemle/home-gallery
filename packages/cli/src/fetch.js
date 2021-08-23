const log = require('@home-gallery/logger')('cli.fetch')

const command = {
  command: 'fetch',
  describe: 'Fetch and merge from remote',
  builder: (yargs) => {
    return yargs.option({
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        alias: 'e',
        describe: 'Events filename'
      },
      storage: {
        alias: 's',
        describe: 'Storage directory'
      },
      remote: {
        alias: 'r',
        describe: 'Remote server url'
      },
      insecure: {
        alias: 'k',
        boolean: true,
        describe: 'Do not verify HTTPS certificates'
      }
    })
    .demandOption(['storage', 'database', 'events', 'remote' ])
  },
  handler: (argv) => {
    const { fetch } = require('@home-gallery/fetch');
    const options = {
      serverUrl: argv.remote,
      databaseFile: argv.database,
      storageDir: argv.storage,
      eventFile: argv.events,
      insecure: argv.insecure
    }
    const t0 = Date.now();
    fetch(options)
      .then(() => {
        log.info(t0, `Fetched remote from ${options.serverUrl}`)
      })
      .catch(err => {
        log.error(err, `Fetch failed from ${options.serverUrl}: ${err}`)
        process.exit(1)
      })
  }
}

module.exports = command;
