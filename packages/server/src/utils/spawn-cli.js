import { spawn } from '@home-gallery/common'

import Logger from '@home-gallery/logger'
const log = Logger('server.cli')

const nodeBin = process.argv[0]
const cliScript = process.argv[1]

export const spawnCli = (args, env = {}) => {
  const spawnEnv = {
    ...env,
    GALLERY_LOG_LEVEL: 'trace',
    GALLERY_LOG_JSON_FORMAT: 'true'
  }
  const t0 = Date.now()
  const cmd = `${nodeBin} ${cliScript} ${args.map(arg => arg.match(/\s/) ? `"${arg}"` : arg).join(' ')}`
  log.info({spawn: {env: spawnEnv, command: nodeBin, args: [cliScript, ...args], cmd}}, `Run cli with ${args.join(' ')}...`)
  const child = spawn(nodeBin, [cliScript, ...args], { env: spawnEnv })

  Logger.mergeLog(child.stdout)

  child.once('exit', (code, signal) => {
    const processInfo = {env: spawnEnv, command: nodeBin, args: [cliScript, ...args], pid: child.pid, code, signal, cmd}
    log.debug({spawn: processInfo, duration: Date.now() - t0}, `Cli ${args.join(' ')} exited with code ${code}`)
  })
  child.once('error', err => {
    log.warn(err, `Failed to run cli ${args.join(' ')}: ${err}`)
  })

  return child
}
