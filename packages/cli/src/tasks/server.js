const { ProcessManager } = require('@home-gallery/common')

const { spawnCli } = require('../utils/spawn-cli')

const log = require('@home-gallery/logger')('cli.task.server')

const getConfigEnv = options => {
  const { configFile, autoConfigFile } = options
  return !autoConfigFile ? {GALLERY_CONFIG: configFile} : {}
}

const pm = new ProcessManager()

const startServer = async options => {
  await new Promise((resolve, reject) => {
    serverProcess = spawnCli(['server'], {env: getConfigEnv(options)})
    pm.addProcess(serverProcess, {terminateTimeout: 15 * 1000})

    serverProcess.once('SIGINT', () => {
      log.info(`Stopping server`)
      pm.killAll('SIGINT')
    })
    serverProcess.once('exit', (code, signal) => {
      code == 0 ? resolve() : reject(new Error(`Server exited with code ${code} and signal ${signal}`))
    })
  })
  return 'exit'
}

module.exports = { startServer }
