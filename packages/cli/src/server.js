const log = require('@home-gallery/logger')('cli.server');

const command = {
  command: 'server',
  describe: 'Start web server',
  builder: (yargs) => {
    return yargs.option({
      storage: {
        require: true,
        alias: 's',
        describe: 'Storage directory'
      },
      database: {
        require: true,
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        require: true,
        alias: 'e',
        describe: 'Events filename'
      },
      host: {
        alias: 'H',
        default: '0.0.0.0',
        string: true,
        describe: 'Listening host IP address'
      },
      port: {
        alias: 'p',
        number: true,
        default: 3000,
        describe: 'Listening TCP port'
      },
      key: {
        alias: 'K',
        describe: 'SSL key file'
      },
      cert: {
        alias: 'C',
        describe: 'SSL certificate file'
      },
      'open-browser': {
        boolean: true,
        default: true,
        describe: 'Open browser on server start'
      }
    })
    .demandOption(['storage', 'database', 'events'])
  },
  handler: (argv) => {
    const { startServer, webappDir } = require('@home-gallery/server');
    const path = require('path');

    const config = {
      host: argv.host,
      port: argv.port,
      storageDir: argv.storage,
      databaseFilename: argv.database,
      eventsFilename: argv.events,
      webappDir,
      key: argv.key,
      cert: argv.cert,
      openBrowser: argv.openBrowser
    }
    startServer(config, (err) => {
      if (err) {
        log.error(`Could not start server: ${err}`);
      } else {
        log.info(`Server started. Open it at http://${argv.host === '0.0.0.0' ? 'localhost' : argv.host}:${argv.port}`);
      }
    })
  }
}

module.exports = command;
