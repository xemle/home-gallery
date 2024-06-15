import { ProcessManager } from '@home-gallery/common'

import { spawnCli } from '../utils/spawn-cli.js'

import Logger from '@home-gallery/logger'

const log = Logger('cli.task.server')
const pm = new ProcessManager()

export const startServer = async options => {
  await new Promise((resolve, reject) => {
    serverProcess = spawnCli(['server'], {env: options.configEnv})
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
