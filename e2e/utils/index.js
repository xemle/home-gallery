const path = require('path')
const { createReadStream } = require('fs')
const zlib = require('zlib')
const { spawn } = require('child_process')

const galleryBin = process.env.gallery_bin || 'node'
const galleryBinArgs = (process.env.gallery_bin_args || 'gallery.js').split(/\s/)

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

const getFilesDir = () => {
  const baseDir = gauge.dataStore.scenarioStore.get('baseDir');
  return path.join(baseDir, 'files')
}

const getIndexFilename = () => {
  const baseDir = gauge.dataStore.scenarioStore.get('baseDir');
  return path.join(baseDir, 'config', 'files.idx')
}

const getStorageDir = () => {
  const baseDir = gauge.dataStore.scenarioStore.get('baseDir');
  return path.join(baseDir, 'storage')
}

const getDatabaseFilename = () => {
  const baseDir = gauge.dataStore.scenarioStore.get('baseDir');
  return path.join(baseDir, 'config', 'database.db')
}

const getEventsFilename = () => {
  const baseDir = gauge.dataStore.scenarioStore.get('baseDir');
  return path.join(baseDir, 'config', 'events.db')
}

const runCliAsync = (args, cb) => {
  const command = [galleryBin, ...galleryBinArgs, ...args].map(v => `${v}`.match(/\s/) ? `"${v}"` : v).join(' ')
  const options = {
    silent: false,
    env: process.env,
    cwd: projectRoot,
    shell: false
  }
  gauge.message(`Call CLI async: ${command}`)
  gauge.dataStore.scenarioStore.put('lastCommand', command)

  const stdout = []
  const stderr = []
  const child = spawn(galleryBin, [...galleryBinArgs, ...args], options)
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

const runCli = async args => new Promise(resolve => runCliAsync(args, resolve))

const readJsonGz = async (filename) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    createReadStream(filename)
      .pipe(zlib.createGunzip())
      .on('data', chunk => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      .on('error', reject)
  })
  .then(data => JSON.parse(data))
}

const readIndex = async () => {
  const filename = getIndexFilename()
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
  getFilesDir,
  getIndexFilename,
  getStorageDir,
  getDatabaseFilename,
  getEventsFilename,
  runCli,
  runCliAsync,
  readIndex,
  readDatabase,
  dateFormat
}
