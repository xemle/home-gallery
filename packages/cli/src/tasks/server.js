const { runCli, loggerArgs } = require('./run')

const startServer = async options => {
  const { config, configFile, autoConfigFile } = options
  const args = [...loggerArgs(config), 'server']

  if (!autoConfigFile) {
    args.push('-c', configFile)
  }
  await runCli(args)
  return 'exit'
}

module.exports = { startServer }
