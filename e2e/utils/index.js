const fs = require('fs')
const {readFile, writeFile} = require('fs/promises')
const path = require('path')
const { createReadStream } = require('fs')
const net = require('net')
const zlib = require('zlib')
const { spawn } = require('child_process')
const os = require('os')
const userInfo = os.userInfo()
const Yaml = require('yaml')
const assert = require('assert')

const galleryBin = process.env.gallery_bin || 'node'
const galleryBinArgs = process.env.gallery_bin_args ? process.env.gallery_bin_args.split(/\s/) : []

const projectRoot = path.resolve(process.cwd(), '..')
const testDataDir = path.join(projectRoot, process.env.gallery_data_dir || 'data')

const logLevel = process.env.GALLERY_LOG_FILE_LEVEL || process.env.GALLERY_LOG_LEVEL || process.env.gallery_log_level || 'debug'

const isWindows = os.platform == 'win32'

const pathToPlatformPath = isWindows ? p => p.split('/').join('\\') : p => p

const generateId = (size) => {
  let id = '';
  while (id.length < size) {
    const c = String.fromCharCode(+(Math.random() * 255).toFixed())
    if (c.match(/[0-9A-Za-z]/)) {
      id += c
    }
  }
  return id
}

const isPortAvailable = async port => {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', err => reject(err))
    server.listen({port, host: '0.0.0.0'}, () => server.close(() => resolve(port)))
  })
}

const portStart = port => {
  let lastPort = port
  const check = async () => isPortAvailable(lastPort++).catch(check)

  return check()
}

const nextPort = async () => {
  const port = await portStart(38000)
  gauge.dataStore.scenarioStore.put('port', port)
  return port
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const waitFor = async (testFn, timeout) => {
  timeout = timeout || 10 * 1000
  const startTime = Date.now()
  let delay = 10

  const next = async () => {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Wait timeout exceeded`)
    }
    return testFn().catch(() => {
      delay = Math.min(500, delay * 2)
      return wait(delay).then(next)
    })
  }

  return next()
}

const getProjectRoot = () => path.resolve(projectRoot)

const getTestDataDir = () => path.resolve(testDataDir)

const getBaseDir = () => gauge.dataStore.scenarioStore.get('baseDir')

const getPath = (...parts) => path.join(getBaseDir(), ...parts)

const getFilesDir = () => getPath('files')

const getConfigFilename = () => getPath('config', 'gallery.config.yml')

const getIndexFilename = () => getPath('config', 'files.idx')

const getJournalFilename = id => `${getIndexFilename()}.${id}.journal`

const getStorageDir = () => getPath('storage')

const getDatabaseFilename = () => getPath('config', 'database.db')

const getEventsFilename = () => getPath('config', 'events.db')

const getExportOutputDir = () => getPath('export-output')

const getPluginBaseDir = () => getPath('plugins')

const getPluginDir = name => {
  const sanitizedName = name.replaceAll(/[^A-Za-z0-9]+/g, '')
  return path.resolve(getPluginBaseDir(), sanitizedName)
}

const tree = async dir => {
  const files = await fs.promises.readdir(dir)
  files.sort()
  let result = []
  for (let file of files) {
    const stat = await fs.promises.stat(path.join(dir, file))
    if (stat.isDirectory()) {
      const subFiles = await tree(path.join(dir, file))
      subFiles.forEach(subFile => result.push(path.join(file, subFile)))
    } else {
      result.push(file)
    }
  }
  return result
}

const resolveArgs = (args, vars) => [].concat(args).map(arg => arg.replace(/\{([^}]+)\}/g, (_, name) => vars[name.trim()] || ''))

const log = {
  log(level, obj, msg) {
    const logFile = getPath('cli.log')
    let log = {
      level,
      time: new Date().toISOString(),
    }

    if (typeof obj == 'number') {
      log = {...log, duration: Date.now() - obj, msg}
    } else if (obj instanceof Error) {
      log = {...log, err: obj, msg}
    } else if (typeof obj == 'object') {
      log = {...log, ...obj, msg}
    } else if (typeof obj == 'string') {
      log = {...log, msg: obj}
    }

    fs.appendFile(logFile, JSON.stringify(log) + '\n', err => {
      if (err) {
        gauge.message(`Could not write cli log: ${err}`)
      }
    })
  },
  trace(obj, msg) {
    this.log(10, obj, msg)
  },
  debug(obj, msg) {
    this.log(20, obj, msg)
  },
  info(obj, msg) {
    this.log(30, obj, msg)
  },
  warn(obj, msg) {
    this.log(40, obj, msg)
  },
  error(obj, msg) {
    this.log(50, obj, msg)
  },
}

const envToString = ([key, value]) => `${key}=${value}`

const escapeWhitespace = v => `${v}`.match(/\s/) ? `"${v}"` : v

const runCommand = (command, args, options, cb) => {
  const spawnOptions = {
    silent: false,
    env: Object.assign({}, process.env, options.env),
    cwd: projectRoot,
    shell: false
  }

  const prettyEnv = Object.entries(options.env || {}).map(envToString)
  const commandLine = [...prettyEnv, command, ...args].map(escapeWhitespace).join(' ')
  gauge.message(`Execute command: ${[command, ...args].map(escapeWhitespace).join(' ')}`)
  gauge.dataStore.scenarioStore.put('lastCommand', commandLine)

  const stdoutChunks = []
  const stderrChunks = []
  const t0 = Date.now()
  log.trace({spawn: {command, args, env: options.env, cmd: commandLine}}, `Executing command: ${[command, ...args].map(escapeWhitespace).join(' ')}`)
  const child = spawn(command, args, spawnOptions)
  child.stdout.on('data', chunk => stdoutChunks.push(chunk))
  child.stderr.on('data', chunk => stderrChunks.push(chunk))

  child.on('exit', (code, signal) => {
    const stdout = Buffer.concat(stdoutChunks).toString('utf8')
    const stderr = Buffer.concat(stderrChunks).toString('utf8')
    const commandHistory = gauge.dataStore.scenarioStore.get('commandHistory') || []
    commandHistory.push({env: options.env || {}, command, args, pid: child.pid, code, signal, stdout, stderr})
    gauge.dataStore.scenarioStore.put('commandHistory', commandHistory)
    gauge.dataStore.scenarioStore.put('lastExitCode', code)
    const spawnInfo = { env: options.env || {}, command, args, pid: child.pid, code, signal, cmd: commandLine, stdout, stderr }
    const data = {spawn: spawnInfo, duration: Date.now() - t0}
    log.info(data, `${commandLine} exited with ${code}`)
    if (cb) {
      cb(code, stdout, stderr)
    }
  })

  child.on('error', (err) => {
    log.error(err, `Failed to execute command ${commandLine}: ${err.message}`)
    if (cb) {
      cb(code, stdout, stderr)
    }
  })

  return child;
}

const killChildProcess = async child => {
  return new Promise(resolve => {
    let count = 0
    const id = setInterval(() => {
      count++
      child.kill(count <= 3 ? 'SIGINT' : 'SIGTERM')
    }, 1000)

    child.on('exit', () => {
      clearInterval(id)
      resolve()
    })
    child.kill('SIGINT')
  })
}

const dropServerPortArgOnDocker = args => {
  if (galleryBin == 'docker') {
    const portPos = args.indexOf('--port')
    if (portPos >= 0) {
      args.splice(portPos, 2)
    }
  }
}

const addCliEnv = (env = {}) => {
  const cliEnv = {...gauge.dataStore.scenarioStore.get('cliEnv') || {}, ...env}
  gauge.dataStore.scenarioStore.put('cliEnv', cliEnv)
}

const runCliAsync = (args, cb) => {
  const vars = {
    projectRoot,
    baseDir: getBaseDir(),
    port: gauge.dataStore.scenarioStore.get('port') || 3000,
    uid: userInfo.uid,
    gid: userInfo.gid
  }
  const galleryArgsResolved = resolveArgs(galleryBinArgs, vars)

  const logOptions = ['--log-file', getPath('e2e.log'), '--log-file-level', logLevel]
  dropServerPortArgOnDocker(args)
  const commandArgs = [...galleryArgsResolved, ...logOptions, ...args]

  const env = gauge.dataStore.scenarioStore.get('cliEnv') || {}
  return runCommand(galleryBin, commandArgs, {TZ: 'Europe/Berlin', env}, cb)
}

const runCli = async (args) => new Promise(resolve => runCliAsync(args, (code, stdout, stderr) => resolve({code, stdout, stderr})))

const readJsonGz = async (filename) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    createReadStream(filename)
      .on('error', reject)
      .pipe(zlib.createGunzip())
      .on('data', chunk => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      .on('error', reject)
  })
  .then(data => JSON.parse(data))
  .catch(err => {
    if (err.code === 'ENOENT') {
      throw new Error(`File ${filename} not found`)
    }
    const error = new Error(`Failed to read ${filename}: ${err}`)
    error.cause = err
    throw error
  })
}

const readIndex = async () => {
  const filename = getIndexFilename()
  return readJsonGz(filename)
}

const readJournal = async (id) => {
  const filename = getJournalFilename(id)
  return readJsonGz(filename)
}

const readDatabase = async () => {
  const filename = getDatabaseFilename()
  return readJsonGz(filename)
}

const pad = (value, len, char) => {
  while (`${value}`.length < len) {
    value = `${char || '0'}${value}`
  }
  return value
}

const dateFormat = (now, format) => format.replace(/%(.)/g, (_, c) => {
  switch (c) {
    case 'Y': return now.getUTCFullYear()
    case 'M': return pad(now.getUTCMonth() + 1, 2)
    case 'D': return pad(now.getUTCDate(), 2)
    case 'H': return pad(now.getUTCHours(), 2)
    case 'm': return pad(now.getUTCMinutes(), 2)
    case 's': return pad(now.getUTCSeconds(), 2)
    default: return ''
  }
})

const assertDeep = (value, expected, path = '.') => {
  if (Array.isArray(expected)) {
    assert(Array.isArray(value), `Expected an array but was ${typeof value} in ${path}`)
    for (let i = 0; i < expected.length; i++) {
      assertDeep(value[i], expected[i], `[${i}].`)
    }
  } else if (typeof expected == 'object') {
    assert(typeof value == 'object', `Expected an object but was ${typeof value} in ${path}`)
    for (let prop in expected) {
      assertDeep(value[prop], expected[prop], `${prop}.`)
    }
  } else {
    assert(value == expected, `Expected ${expected} but was ${value} (${JSON.stringify(value)}) in ${path}`)
  }
}

const resolveProperty = (value, path) => {
  const parts = path.split('.')
  let i = 0
  while (i < parts.length && value) {
    const part = parts[i++]
    const [orig, name, _, index] = part.match(/^([a-zA-Z]+)(\[(\d+)\])?$/)
    if (index) {
      value = Array.isArray(value[name]) ? value[name][+index] : undefined
    } else {
      value = value[part]
    }
  }
  return value
}

const parseValue = yamlLike => {
  if (yamlLike.match(/^(\[[^\]]+]|\{[^\}]+})$/)) {
    try {
      return Yaml.parse(yamlLike)
    } catch (e) {
      assert(false, `Could not parse given YAML value ${yamlLike}: ${e}`)
    }
  }
  return yamlLike
}

const readYaml = async filename => {
  const yml = await readFile(filename, 'utf-8')
  try {
    return Yaml.parse(yml)
  } catch (e) {
    return Promise.reject(e)
  }
}

const readConfig = async () => {
  const filename = getConfigFilename()
  return readYaml(filename)
}

const writeConfig = async (config) => {
  const filename = getConfigFilename()
  writeFile(filename, Yaml.stringify(config))
}

const getSegement = (object, key) => {
  const parts = key.split('.')
  let segment = object
  for (let i = 0; i < parts.length - 1; i++) {
    if (!segment[parts[i]] || typeof segment[parts[i]] != 'object') {
      segment[parts[i]] = {}
    }
    segment = segment[parts[i]]
  }
  return [segment, parts[parts.length - 1]]
}

const getConfigValue = async (key) => {
  const config = await readConfig().catch(() => ({}))
  return resolveProperty(config, key)
}

const setConfigValue = async (key, value) => {
  const config = await readConfig()

  const pos = key.lastIndexOf('.')
  if (pos >= 0) {
    const prop = resolveProperty(config, key.substring(0, pos))
    prop[key.substring(pos + 1)] = value
  } else {
    config[key] = value
  }

  await writeConfig(config)
}

module.exports = {
  addCliEnv,
  assertDeep,
  generateId,
  nextPort,
  wait,
  waitFor,
  getProjectRoot,
  getTestDataDir,
  getBaseDir,
  getPath,
  getFilesDir,
  getConfigFilename,
  getConfigValue,
  getIndexFilename,
  getJournalFilename,
  getStorageDir,
  getDatabaseFilename,
  getEventsFilename,
  getExportOutputDir,
  getPluginBaseDir,
  getPluginDir,
  log,
  tree,
  runCommand,
  runCli,
  runCliAsync,
  setConfigValue,
  killChildProcess,
  readIndex,
  readJournal,
  readDatabase,
  resolveProperty,
  parseValue,
  dateFormat,
  pathToPlatformPath,
}
