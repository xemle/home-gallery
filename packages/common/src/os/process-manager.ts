class Process {
  stopped = false
  exitCode = 0

  constructor (child, terminateTimeout = 1000) {
    this.child = child
    this.terminateTimeout = terminateTimeout

    this.child.on('exit', (code) => {
      this.stopped = true
      this.exitCode = code
    })
  }

  async kill(signal = 'SIGINT') {
    if (this.stopped) {
      return Promise.resolve(this.exitCode)
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.child.kill('SIGTERM')
      }, this.terminateTimeout)

      this.child.on('exit', (code) => {
        clearTimeout(timer)
        resolve(code)
      })

      this.child.kill(signal)
    })
  }
}

export class ProcessManager {
  isStopped = false
  processes = []

  addProcess(child, {terminateTimeout}) {
    const p = new Process(child, terminateTimeout)
    this.processes.push(p)

    child.on('exit', () => {
      this.processes = this.processes.filter(process => process != p)
    })
  }

  async killAll(signal = 'SIGINT') {
    this.isStopped = true
    if (this.processes.length === 0) {
      return Promise.resolve()
    }

    return Promise.all(this.processes.map(p => p.kill(signal)))
  }
}
