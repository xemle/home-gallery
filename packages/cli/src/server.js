const { load, mapArgs } = require('./config');

const log = require('@home-gallery/logger')('cli.server');

const mapUsers = users => {
  return users.map(user => {
    const pos = user.indexOf(':')
    if (pos < 0) {
      return false
    }
    return {
      username: user.slice(0, pos),
      password: user.slice(pos + 1)
    }
  }).filter(user => user !== false)
}

const mapRules = rules => {
  return rules.map(rule => {
    const pos = rule.indexOf(':')
    if (pos < 0) {
      return false
    }
    return {
      type: rule.slice(0, pos),
      value: rule.slice(pos + 1)
    }
  }).filter(rule => rule !== false)
}

const command = {
  command: 'server',
  describe: 'Start web server',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration files'
      },
      storage: {
        alias: 's',
        describe: 'Storage directory'
      },
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        alias: 'e',
        describe: 'Events filename'
      },
      host: {
        alias: 'H',
        string: true,
        describe: 'Listening host IP address'
      },
      port: {
        alias: 'p',
        number: true,
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
      'base-path': {
        alias: 'b',
        type: 'string',
        describe: 'Base path of static page. e.g. "/gallery"'
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
        describe: 'Open browser on server start'
      },
      'remote-console-token': {
        string: true,
        describe: 'Enable remote console with given debug auth token'
      }
    })
    .default('host', undefined, '0.0.0.0')
    .default('port', undefined, '3000')
    .default('base-path', undefined, '/')
    .default('open-browser', undefined, 'true')
  },
  handler: (argv) => {
    const { startServer, webappDir } = require('@home-gallery/server');

    const ensureLeadingSlash = url => url.startsWith('/') ? url : '/' + url

    const mapping = {
      host: 'server.host',
      port: 'server.port',
      storage: 'storage.dir',
      database: 'database.file',
      events: 'events.file',
      key: 'server.key',
      cert: 'server.cert',
      basePath: {path: 'server.basePath', map: (basePath) => ensureLeadingSlash(basePath)},
      openBrowser: 'server.openBrowser',
      remoteConsoleToken: 'server.removeConsoleToken',
      user: {path: 'server.auth.users', type: 'add', map: mapUsers},
      ipWhitelistRule: {path: 'server.auth.rules', map: mapRules}
    }

    const run = async (argv) => {
      const { config, configFile } = await load(argv.config, false)
      mapArgs(argv, config, mapping)

      return new Promise((resolve, reject) => {
        startServer({config, configFile}, (err, server) => {
          if (err) {
            return reject(err)
          }
          server.once('close', () => {
            // force exit due dangling processes
            setTimeout(() => process.exit(0), 100)
            resolve()
          })
        })
      })
    }

    run(argv)
      .catch(err => {
        log.error(err, `Failed to start server: ${err}`)
        process.exit(1)
      })
  }
}

module.exports = command;
