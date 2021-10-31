/**
 * Sharp comes with prebuild binarys which might require non supported CPU
 * flags. This script checks available CPU flags and install a previous
 * compatible sharp version if required CPU flags are missing. Only linux/x64
 * is supported for a fallback currently
 */
const os = require('os')
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
let libc

try {
  libc = require('detect-libc')
} catch (e) {
  console.log(`Could not find package detect-lib. Skip further sharp validation. Error: ${e}`)
  process.exit(0)
}

const FALLBACK_HOST = 'https://dl.home-gallery.org/npm/libvips'
const platform = process.env.npm_config_platform || process.platform
const arch = process.env.npm_config_arch || process.arch
const hasLibC = libc.family == libc.GLIBC
const isLinuxX64 = platform.match(/linux/i) && arch == 'x64'
const requiredCpuFlags = ['sse4_2']

const log = (...args) => {
  if (process.env['DEBUG']) {
    console.log(...args)
  }
}

// version format is v14.19.0
const getNodeMajorVersion = () => +process.version.substring(1).split('.')[0]

const run = async (command, args, options) => {
  const defaults = { shell: true }
  const optionsEnv = (options || {}).env || {}
  const env = {...process.env, ...optionsEnv};
  const swanOptions = {...defaults, ...options, env}

  return new Promise((resolve, reject) => {
    log(`run ${command} ${args.join(' ')}`)
    const cmd = spawn(command, args, swanOptions);

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

const exists = file => fs.access(file).then(() => true).catch(() => false)

const findPackage = async (dir, name) => {
  if (!dir || dir == '/') {
    return false;
  }
  const packageDir = path.join(dir, 'node_modules', name);
  const found = await exists(path.join(packageDir, 'package.json'))
  if (found) {
    return packageDir
  }
  return findPackage(path.dirname(dir), name)
}

const requiresFallback = async () => {
  if (!isLinuxX64 || !hasLibC) {
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

const removeVendorDir = async (sharpDir) => {
  const vendorDir = path.join(sharpDir, 'vendor')
  log(`Remove old vendor directory ${vendorDir}`)
  const majorVersion = getNodeMajorVersion()
  if (majorVersion >= 16) {
    await fs.rm(vendorDir, {recursive: true})
  } else {
    // deprecated since v16
    await fs.rmdir(vendorDir, {recursive: true})
  }
}

const installLibvips = async (sharpDir) => {
  const cacheDir = path.join(os.homedir(), '.npm', '_libvips-fallback');
  const env = {
    'npm_config_cache': cacheDir,
    'npm_config_sharp_libvips_binary_host': FALLBACK_HOST
  }

  console.log(`Reinstall compatible libvips version fallback`)
  log(`Fallback cacheDir is ${cacheDir}`)
  log(`Fallback binary host is ${FALLBACK_HOST}`)
  return run('npm', [`--prefix=${sharpDir}`, `--platform=${platform}`, `--arch=${arch}`, 'run', 'install'], {shell: true, stdio: 'inherit', env})
}

const installFallback= async (fallbackRequired) => {
  const forceFallback = process.env.LIBVIPS_FALLBACK_INSTALL || process.env.npm_config_libvips_fallback_install
  if (!fallbackRequired && !forceFallback) {
    return;
  }
  const sharpDir = await findPackage(process.cwd(), 'sharp');
  if (!sharpDir) {
    console.log(`Could not find sharp package. Is it installed?`)
    return false
  }
  log(`Found sharp package in ${sharpDir}`)
  await removeVendorDir(sharpDir)
  await installLibvips(sharpDir)
}

requiresFallback()
  .then(installFallback)
  .catch(err => {
    console.log(`Failed to reinstall sharp: Error ${err.code ? err.code : err}. Are packages make gcc python installed?`)
    process.exit(1)
  })
