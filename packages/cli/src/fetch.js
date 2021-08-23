const log = require('@home-gallery/logger')('cli.fetch')

const command = {
  command: 'fetch',
  describe: 'Fetch and merge from remote',
  builder: (yargs) => {
    return yargs.option({
      'server-url': {
        alias: ['u', 'url'],
        describe: 'Gallery server url'
      },
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
      insecure: {
        alias: 'k',
        boolean: true,
        describe: 'Do not verify HTTPS certificates'
      }
    })
    .demandOption(['url', 'storage', 'database', 'events'])
  },
  handler: (argv) => {
    const { fetch } = require('@home-gallery/fetch');
    const options = {
      serverUrl: argv.url,
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
