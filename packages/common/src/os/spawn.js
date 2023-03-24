const { spawn } = require('child_process')

const rateLimit = require('../utils/rate-limit')

const spawnDefaults = { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'inherit'] }

/**
 * On ctrl+c the SIGINT (2) signal is emitted to the process group while
 * a single kill -INT is emitted only to the process. On the later
 * child processes do not receive the signals and a gracefull exit of
 * child processes can be performed.
 *
 * This function forwards the signal to the child process. It is rate limited
 * to eliminate duplicated signals from parent and and process group
 * through ctrl+c
 *
 * @param {Process} child Child process
 * @param {string} signal
 */
const forwardSignal = (child, signal) => {
  const forward = rateLimit(() => child.kill(signal), 100)

  process.on(signal, forward)
  child.on('exit', () => process.off(signal, forward))
}

const spawnCommand = (command, args = [], options = {}) => {
  const env = {...process.env, ...options.env}
  const child = spawn(command, args, {...spawnDefaults, ...options, env})
  forwardSignal(child, 'SIGINT')
  return child
}

const run = async (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const cmd = spawnCommand(command, args, options)
    cmd.once('exit', (code) => code == 0 ? resolve(code) : reject(code))
    cmd.once('err', reject)
  })
}

module.exports = {
  spawn: spawnCommand,
  run
}