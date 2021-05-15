const fs = require('fs').promises
const path = require('path')

const { exists, downloadFile, extractArchive } = require('./download')

const logLevel = process.env.LOG_LEVEL || 'info'

const log = {
  logger: (level, ...args) => {
    if (level === 'info' || logLevel === 'debug') {
      console.log(...args)
    }
  },
  debug: function(...args) { this.logger('debug', ...args) },
  info: function(...args) { this.logger('info', ...args) },
}

const downloadNodeJs = async (baseUrl, nodeVersion, targetDir) => {
  const {version, platform, arch} = nodeVersion;
  const hasDir = await exists(targetDir);
  if (hasDir) {
    log.info(`Skip downloading NodeJS of existing ${platform}-${arch} dir`)
    return
  }

  const tmpDir = path.join(path.dirname(targetDir), `${platform}-${arch}.tmp`)
  const basename = `node-v${version}-${platform}-${arch}`
  const filename = `${basename}.${platform != 'win' ? 'tar.gz' : 'zip'}`
  const url = `${baseUrl}/v${version}/${filename}`
  const archive = path.resolve(tmpDir, filename)

  log.info(`Downloading NodeJS ${version} for ${platform}-${arch}`)
  log.debug(`Downloading ${filename} from ${baseUrl}`)
  await downloadFile(url, archive)
  log.debug(`Extracting archive ${filename} to ${tmpDir}`)
  await extractArchive(archive, path.resolve(tmpDir))
  log.debug(`Move ${tmpDir}/${basename} to target dir ${targetDir}`)
  await fs.rename(path.join(`${tmpDir}/${basename}`), targetDir)
  log.debug(`Remove temporary ${filename} and ${tmpDir}`)
  await fs.unlink(archive)
  //log('debug', `Remove tmp directory ${tmpDir}`)
  await fs.rmdir(tmpDir, {recursive: true})
  log.info(`Downloaded NodeJs v${version} for ${platform}-${arch} to ${targetDir}`)
}

const downloadNodes = async (baseUrl, nodeVersions, targetDir) => {
  await Promise.all(nodeVersions.map(version => downloadNodeJs(baseUrl, version, path.join(targetDir, `${version.platform}-${version.arch}`))))
}

const run = async (baseUrl, version, platforms, targetDir) => {
  const nodeVersions = platforms.map(platformArch => {
    const [platform, arch] = platformArch.split('-')
    return {
      version,
      platform,
      arch
    }
  })
  await downloadNodes(baseUrl, nodeVersions, targetDir);
}

const parseArgReducer = (options, arg) => {
  if (arg.length <= 2 || !arg.startsWith('--')) {
    return options;
  }
  let [name, value] = arg.substr(2).split('=')
  name = name.replace(/-./g, m => m.substr(1, 1).toUpperCase())
  options[name] = typeof value != 'undefined' ? value : true
  return options;
}

const options = process.argv.slice(2).reduce(parseArgReducer, {});

const platforms = (options.platforms || `${process.platform}-${process.arch}`).split(',')
const targetDir = options.targetDir || 'node';
const version = options.version || '14.6.1';
const baseUrl = options.baseUrl || 'https://nodejs.org/dist';

run(baseUrl, version, platforms, targetDir)
  .then(() => console.log(`All NodeJS ${version} are downloaded for platforms ${platforms.join(', ')} in dir ${targetDir}`))
  .catch(console.error)