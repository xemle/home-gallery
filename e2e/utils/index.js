const path = require('path')
const { createReadStream } = require('fs')
const zlib = require('zlib')
const { spawn } = require('child_process')
const userInfo = require("os").userInfo()

const galleryBin = process.env.gallery_bin || 'node'
const galleryBinArgs = process.env.gallery_bin_args ? process.env.gallery_bin_args.split(/\s/) : []

const projectRoot = path.resolve(process.cwd(), '..')
const testDataDir = path.join(projectRoot, process.env.gallery_data_dir || 'data')

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

const getTestDataDir = () => path.resolve(testDataDir)

const getBaseDir = () => gauge.dataStore.scenarioStore.get('baseDir')

const getFilesDir = () => path.join(getBaseDir(), 'files')

const getConfigFilename = () => path.join(getBaseDir(), 'config', 'gallery.config.yml')

const getIndexFilename = () => path.join(getBaseDir(), 'config', 'files.idx')

const getJournalFilename = id => `${getIndexFilename()}.${id}.journal`

const getStorageDir = () => path.join(getBaseDir(), 'storage')

const getDatabaseFilename = () => path.join(getBaseDir(), 'config', 'database.db')

const getEventsFilename = () => path.join(getBaseDir(), 'config', 'events.db')

const getExportOutputDir = () => path.join(getBaseDir(), 'export-output')

const resolveArgs = (args, vars) => [].concat(args).map(arg => arg.replace(/\{([^}]+)\}/g, (_, name) => vars[name.trim()] || ''))

const runCommand = (command, args, options, cb) => {
  const spawnOptions = {
    silent: false,
    env: Object.assign({}, process.env, options.env),
    cwd: projectRoot,
    shell: false
  }
  const commandLine = [command, ...args].map(v => `${v}`.match(/\s/) ? `"${v}"` : v).join(' ')
  gauge.message(`Execute command: ${commandLine}`)
  gauge.dataStore.scenarioStore.put('lastCommand', commandLine)

  const stdout = []
  const stderr = []
  const child = spawn(command, args, spawnOptions)
  child.stdout.on('data', chunk => stdout.push(chunk))
  child.stderr.on('data', chunk => stderr.push(chunk))

  child.on('exit', (code) => {
    gauge.dataStore.scenarioStore.put('lastExitCode', code)
    if (cb) {
      cb(code, Buffer.concat(stdout).toString('utf8'), Buffer.concat(stderr).toString('utf8'))
    }
  })

  return child;
}

const runCliAsync = (args, options, cb) => {
  if (!cb) {
    cb = options
    options = {}
  } else if (!options) {
    options = {}
  }

  const vars = {
    projectRoot,
    baseDir: getBaseDir(),
    port: gauge.dataStore.scenarioStore.get('port'),
    uid: userInfo.uid,
    gid: userInfo.gid
  }
  const galleryArgsResolved = resolveArgs(galleryBinArgs, vars)

  const logOptions = ['--log-file', path.join(getBaseDir(), 'e2e.log'), '--log-file-level', 'debug']
  const commandArgs = [...galleryArgsResolved, ...logOptions, ...args]

  return runCommand(galleryBin, commandArgs, {TZ: 'Europe/Berlin', ...options}, cb)
}

const runCli = async (args, options) => new Promise(resolve => runCliAsync(args, options, (code, stdout, stderr) => resolve({code, stdout, stderr})))

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
  return await readJsonGz(filename)
}

const readJournal = async (id) => {
  const filename = getJournalFilename(id)
  return await readJsonGz(filename)
}

const readDatabase = async () => {
  const filename = getDatabaseFilename()
  return await readJsonGz(filename)
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

module.exports = {
  generateId,
  getTestDataDir,
  getBaseDir,
  getFilesDir,
  getConfigFilename,
  getIndexFilename,
  getJournalFilename,
  getStorageDir,
  getDatabaseFilename,
  getEventsFilename,
  getExportOutputDir,
  runCli,
  runCliAsync,
  readIndex,
  readJournal,
  readDatabase,
  dateFormat
}
