const path = require('path');
const debug = require('debug')('cli:server');

const startServer = require('./index');

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
        alias: 'd',
        describe: 'Database filename'
      },
      host: {
        alias: 'H',
        default: 'localhost',
        string: true,
        describe: 'Host ip address'
      },
      port: {
        alias: 'p',
        number: true,
        default: 3000,
        describe: 'Listening TCP port'
      }
    })
    .demandOption(['storage', 'database'])
  },
  handler: (argv) => {
    const webappDir = path.resolve(__dirname || '.', '..', 'public');
    startServer(argv.host, argv.port, argv.storage, argv.database, webappDir, (err) => {
      if (err) {
        debug(`Could not start server: ${err}`);
      } else {
        debug(`Server started. Open it at http://${argv.host === '0.0.0.0' ? 'localhost' : argv.host}:${argv.port}`);
      }
    })
  }
}

module.exports = command;
