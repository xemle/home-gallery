const { runCli, loggerArgs } = require('./run')

const startServer = async config => {
  const server = config.server || {};

  const args = [...loggerArgs(config), 'server',
    '--storage', config.storage.dir,
    '--database', config.database.file,
    '--events', config.events.file,
  ];
  server.host && args.push('--host', server.host)
  server.port && args.push('--port', server.port)
  server.key && server.cert && args.push('--key', server.key, '--cert', server.cert)
  if (server.openBrowser !== undefined) {
    server.openBrowser ? args.push('--open-browser') : args.push('--no-open-browser')
  }

  if (server.auth?.users?.length) {
    const { users, rules } = server.auth
    users.forEach(user => {
      const keys = Object.keys(user)
      if (keys.length == 1) {
        args.push('--user', `${keys[0]}:${user[keys[0]]}`)
      }
    })
    if (rules?.length) {
      rules.forEach(rule => {
        const keys = Object.keys(rule)
        if (keys.length == 1) {
          args.push('--rule', `${keys[0]}:${rule[keys[0]]}`)
        }
      })
    }
  }
  await runCli(args)
  return 'exit'
}

module.exports = { startServer }
