const { spawn } = require('@home-gallery/common')

const Logger = require('@home-gallery/logger')
const log = Logger('cli.task.run')

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

const spawnCli = (args, options = {}, nodeArgs = []) => {
  const runArgs = [...nodeArgs, cliScript, ...args]
  const env = {
    ...options.env,
    GALLERY_LOG_LEVEL: 'trace',
    GALLERY_LOG_JSON_FORMAT: 'true'
  }
  const cmd = `${prettyEnv(env)}${nodeBin} ${prettyArgs(runArgs)}`
  log.info(`Run cli with ${prettyArgs(args)}`)
  const t0 = Date.now()
  const child = spawn(nodeBin, runArgs, { ...options, env, stdio: ['pipe', 'pipe', 'inherit'] })
  log.trace(`Executing ${cmd} with pid ${child.pid}`)
  Logger.mergeLog(child.stdout)

  child.once('exit', (code, signal) => {
    const cli = {cmd, env, nodeBin, nodeArgs, args, code}
    log.debug({cli, duration: Date.now() - t0}, `Executed cmd ${cmd}`)
    signal && log.info(`Cli ${prettyArgs(args)} exited by signal ${signal}`)
  })
  child.once('error', err => {
    log.error(err, `Failed to execute cmd: ${cmd}`)
  })

  return child
}

const runCli = async (args, options = {}, nodeArgs = []) => {
  const child = spawnCli(args, options, nodeArgs)

  return new Promise((resolve, reject) => {
    child.once('exit', (code, signal) => {
      if (code == 0) {
        resolve()
      } else {
        reject({code, signal})
      }
    })
    child.once('error', err => {
      reject(err)
    })
  })
}

module.exports = { runCli, spawnCli }
