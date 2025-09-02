import { SpawnOptionsWithoutStdio, spawn as spawnOrig} from 'child_process'

import { rateLimit } from '../utils/index.js'

const spawnDefaults: SpawnOptionsWithoutStdio = { shell: false, windowsHide: true, stdio: 'pipe' }

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

export const spawn = (command, args = [], options: {env?: Record<string, string>} = {}) => {
  const env = {...process.env, ...options.env}
  const child = spawnOrig(command, args, {...spawnDefaults, ...options, env})
  forwardSignal(child, 'SIGINT')
  return child
}

export const run = async (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, options)
    cmd.once('exit', (code) => code == 0 ? resolve(code) : reject(code))
    cmd.once('err', reject)
  })
}
