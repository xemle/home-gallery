const { spawn } = require('child_process');

const log = require('@home-gallery/logger')('cli.task.run')

const nodeBin = process.argv[0]
const cliScript = process.argv[1]

const run = async (command, args, options) => {
  const defaults = { shell: false, stdio: 'inherit'}
  const optionsEnv = (options || {}).env || {}
  const optionsEnvList = Object.keys(optionsEnv).map(name => `${name}=${optionsEnv[name]}`)

  return new Promise((resolve, reject) => {
    log.info(`Execute: ${optionsEnvList.length ? `${optionsEnvList.join(' ')} ` : ''}${[command, ...args].map(v => / /.test(v) ? `"${v}"` : v).join(' ')}`)
    const env = {...process.env, ...optionsEnv};
    const cmd = spawn(command, args, {...defaults, ...options, env});
    cmd.on('exit', (code, signal) => code == 0 ? resolve(code, signal) : reject(code, signal));
    cmd.on('err', reject)
  })
}

const runCli = async(args, options, nodeArgs) => run(nodeBin, [...(nodeArgs || []), cliScript, ...args], options)

const isValidLevel = level => ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'].indexOf(level) >= 0

const loggerArgs = config => {
  const loggers = config.logger || []
  const args = []
  loggers.forEach(logger => {
    if (logger.type == 'console' && isValidLevel(logger.level)) {
      args.push('--log-level', logger.level)
    } else if (logger.type == 'file' && isValidLevel(logger.level) && logger.file) {
      args.push('--log-file', logger.file, '--log-file-level', logger.level)
    }
  })
  return args
}

module.exports = { run, runCli, loggerArgs }
