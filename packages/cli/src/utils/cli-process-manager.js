const { ProcessManager } = require('@home-gallery/common')

const { spawnCli } = require('./spawn-cli')

class CliProcessManager extends ProcessManager {
  constructor() {
    super()
    process.once('SIGINT', () => this.stopped = true)
  }

  async runCli(args, terminateTimeout = 1000, nodeArgs = []) {
    if (this.isStopped) {
      return
    }
    const child = spawnCli(args, {}, nodeArgs)
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