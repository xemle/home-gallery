const { spawn } = require('child_process');

const nodeBin = process.argv[0]
const cliScript = process.argv[1]

const run = async (command, args, options) => {
  const defaults = { shell: false, stdio: 'inherit'}
  const optionsEnv = (options || {}).env || {}
  const optionsEnvList = Object.keys(optionsEnv).map(name => `${name}=${optionsEnv[name]}`)

  return new Promise((resolve, reject) => {
    console.log(`Execute: ${optionsEnvList.length ? `${optionsEnvList.join(' ')} ` : ''}${[command, ...args].map(v => / /.test(v) ? `"${v}"` : v).join(' ')}`)
    const env = {...process.env, ...optionsEnv};
    const cmd = spawn(command, args, {...defaults, ...options, env});
    cmd.on('exit', (code, signal) => code == 0 ? resolve(code, signal) : reject(code, signal));
    cmd.on('err', reject)
  })
}

const runCli = async(args, options, nodeArgs) => run(nodeBin, [...(nodeArgs || []), cliScript, ...args], options)

module.exports = { run, runCli }
