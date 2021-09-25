const log = require('@home-gallery/logger')('cli.server');

const mapUsers = user => {
  const pos = user.indexOf(':')
  return {
    username: user.slice(0, pos),
    password: user.slice(pos + 1)
  }
}

const mapRules = rule => {
  const pos = rule.indexOf(':')
  return {
    type: rule.slice(0, pos),
    value: rule.slice(pos + 1)
  }
}

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
      user: {
        alias: 'U',
        array: true,
        describe: 'User and password for basic authentication. Format is username:password. Password schema can be {SHA}, otherwise it is plain'
      },
      'ip-whitelist-rule': {
        alias: ['rule', 'R'],
        array: true,
        describe: 'IP whitelist rule in format type:network. E.g. allow:192.168.0/24 or deny:all. First matching rule wins.'
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
      users: argv.user ? argv.user.map(mapUsers) : false,
      ipWhitelistRules: argv.ipWhitelistRule ? argv.ipWhitelistRule.map(mapRules) : [],
      openBrowser: argv.openBrowser,
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
