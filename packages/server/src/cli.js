const debug = require('debug')('cli:server');

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
        default: 'localhost',
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
      }
    })
    .demandOption(['storage', 'database', 'events'])
  },
  handler: (argv) => {
    const startServer = require('./index');
    const path = require('path');

    const config = {
      host: argv.host,
      port: argv.port,
      storageDir: argv.storage,
      databaseFilename: argv.database,
      eventsFilename: argv.events,
      webappDir: path.resolve(__dirname || '.', 'public'),
      key: argv.key,
      cert: argv.cert
    }
    startServer(config, (err) => {
      if (err) {
        debug(`Could not start server: ${err}`);
      } else {
        debug(`Server started. Open it at http://${argv.host === '0.0.0.0' ? 'localhost' : argv.host}:${argv.port}`);
      }
    })
  }
}

module.exports = command;
