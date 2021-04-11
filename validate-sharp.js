/**
 * Sharp comes with prebuild binarys which might require non supported CPU
 * flags. This script checks available CPU flags and install a previous
 * compatible sharp version if required CPU flags are missing. Only linux/x64
 * is supported for a fallback currently
 */
const { spawn } = require('child_process');

const isLinuxX64 = process.platform.match(/linux/i) && process.arch == 'x64'
const requiredCpuFlags = ['sse4_2']

const run = async (command, args, options) => {
  const defaults = { shell: true }
  const optionsEnv = (options || {}).env || {}

  return new Promise((resolve, reject) => {
    const env = {...process.env, ...optionsEnv};
    const cmd = spawn(command, args, {...defaults, ...options, env});

    const stdout = [];
    const stderr = [];
    if (cmd.stdout && cmd.stderr) {
      cmd.stdout.on('data', data => stdout.push(data))
      cmd.stderr.on('data', data => stderr.push(data))
    }

    cmd.on('exit', (code, signal) => {
      const result = {code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)}
      return code == 0 ? resolve(result) : reject(result)
    });
    cmd.on('err', err => {
      err.code = err.code || 254;
      err.stdout = Buffer.concat(stdout);
      err.stderr = Buffer.concat(stderr);
      reject(err)
    })
  })
}

const getCpuFlags = async () => {
  const { stdout } = await run('cat', ['/proc/cpuinfo'])
  const flagLine = stdout.toString('utf8').split(/\n/).find(line => line.match(/^flags/))
  if (!flagLine) {
    console.log(`Could not read CPU flags from /proc/cpuinfo`)
    return [];
  }
  return flagLine.replace(/.*: /, '').split(' ')
}

const requiresFallback = async () => {
  if (!isLinuxX64) {
    return false;
  }
  const flags = await getCpuFlags();
  const missingFlags = requiredCpuFlags.filter(flag => flags.indexOf(flag) < 0)
  if (!missingFlags.length) {
    return false;
  }
  console.log(`Found missing required CPU flags for prebuild sharp binary: ${missingFlags}`)
  return true;
}

const installFallback= async (fallbackRequired) => {
  if (!fallbackRequired) {
    return;
  }
  console.log(`Reinstall compatible sharp version 0.27.2 as fallback`)
  return run('npm', ['install', '--no-save', 'sharp@0.27.2'], {stdio: 'inherit'})
}

requiresFallback()
  .then(installFallback)
  .catch(err => {
    console.log(`Failed to reinstall sharp: Exit code is ${err.code}. Are packages make gcc python installed?`)
    process.exit(1)
  })
