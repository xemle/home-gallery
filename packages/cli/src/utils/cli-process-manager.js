import { ProcessManager } from '@home-gallery/common'

import { spawnCli } from './spawn-cli.js'

const defaultOptions = {
  env: {},
  terminateTimeout: 1000, 
  nodeArgs: [],
}

export class CliProcessManager extends ProcessManager {
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
