const { spawn } = require('child_process')

const spawnCommand = (command, args = [], options = {}) => {
  const env = {...process.env, ...options.env}
  return spawn(command, args, {...options, env})
}

const run = async (command, args = [], options = {}) => {
  const spawnDefaults = { shell: false, stdio: 'inherit'}

  return new Promise((resolve, reject) => {
    const cmd = spawnCommand(command, args, {...spawnDefaults, ...options})
    cmd.once('exit', (code) => code == 0 ? resolve(code) : reject(code))
    cmd.once('err', reject)
  })
}

module.exports = {
  spawn: spawnCommand,
  run
}