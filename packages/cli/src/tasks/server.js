const { spawnCli } = require('./run')

const getCommonCliArgs = options => {
  const { configFile, autoConfigFile } = options
  const configArgs = !autoConfigFile ? ['-c', configFile] : []

  return [...configArgs]
}

const startServer = async options => {
  const commonArgs = getCommonCliArgs(options)

  await new Promise((resolve, reject) => {
    const serverProcess = spawnCli([...commonArgs, 'server'])

    serverProcess.once('exit', (code) => {
      code == 0 ? resolve() : reject(new Error('Server exited with code ' + code))
    })
  })
  return 'exit'
}

module.exports = { startServer }
