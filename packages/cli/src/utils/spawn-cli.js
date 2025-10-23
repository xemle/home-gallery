import { spawn } from '@home-gallery/common'

import Logger from '@home-gallery/logger'
const log = Logger('cli.spawn')

const nodeBin = process.argv[0]
const cliScript = process.argv[1]

const prettyEnv = (env = {}) => {
  const list = Object.entries(env).map(([name, value]) => `${name}=${value}`)
  if (list.length) {
    list.push('')
    return list.join(' ')
  }
  return ''
}

const prettyArgs = (args = []) => args.map(v => / /.test(v) ? `"${v}"` : v).join(' ')

export const spawnCli = (args, options = {}, nodeArgs = []) => {
  const runArgs = [...nodeArgs, cliScript, ...args]
  const env = {
    ...options.env,
    GALLERY_LOG_LEVEL: 'trace',
    GALLERY_LOG_JSON_FORMAT: 'true'
  }
  const t0 = Date.now()
  const cmd = `${prettyEnv(env)}${nodeBin} ${prettyArgs(runArgs)}`
  log.info(`Run cli with ${prettyArgs(args)}`)
  const child = spawn(nodeBin, runArgs, { ...options, env })
  log.trace(`Executing ${cmd} with pid ${child.pid}`)

  Logger.mergeLog(child.stdout)

  child.stderr.on('data', data => {
    const stderr = data.toString()
    const spawnInfo = {env, command: nodeBin, args: runArgs, pid: child.pid, cmd, stderr}
    log.error({spawn: spawnInfo}, `Cli reports error: ${stderr}`)
  })

  child.once('exit', (code, signal) => {
    const spawnInfo = {env, command: nodeBin, args: runArgs, pid: child.pid, code, signal, cmd}
    log.debug({spawn: spawnInfo, duration: Date.now() - t0}, `Executed cmd ${cmd}`)
    signal && log.info(`Cli ${prettyArgs(args)} exited by signal ${signal}`)
  })
  child.once('error', err => {
    log.error(err, `Failed to execute cmd: ${cmd}`)
  })

  return child
}
