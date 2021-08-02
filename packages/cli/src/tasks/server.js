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

  await runCli(args)
  return 'exit'
}

module.exports = { startServer }
