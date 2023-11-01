const { ProcessManager } = require('@home-gallery/common')

const { spawnCli } = require('./spawn-cli')

const defaultOptions = {
  env: {},
  terminateTimeout: 1000, 
  nodeArgs: [],
}

class CliProcessManager extends ProcessManager {
  constructor() {
    super()
    process.once('SIGINT', () => this.stopped = true)
  }

  async runCli(args, options) {
    if (this.isStopped) {
      return
    }
    const { env, nodeArgs, terminateTimeout } = {...defaultOptions, ...options}
    const child = spawnCli(args, {env}, nodeArgs)
    this.addProcess(child, {terminateTimeout})

    return new Promise((resolve, reject) => {
      child.once('exit', (code, signal) => code === 0 ? resolve({code, signal}) : reject({code, signal}))
      child.once('error', reject)
    })
  }
}

module.exports = {
  CliProcessManager
}