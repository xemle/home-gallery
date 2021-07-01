const path = require('path')
const { createReadStream } = require('fs')
const zlib = require('zlib')

const { exec } = require('shelljs')

const galleryBin = process.env.gallery_bin || 'gallery.js'

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


const runCli = async (args) => {
  const command = ['node', galleryBin, ...args].map(v => v.match(/\s/) ? `"${v}"` : v).join(' ')
  const options = {
    silent: false,
    env: process.env,
    cwd: projectRoot
  }
  const cmd = exec(command, options)
  return [cmd.code, command]
}

const runCliAsync = (args, cb) => {
  const command = ['node', galleryBin, ...args].map(v => `${v}`.match(/\s/) ? `"${v}"` : v).join(' ')
  const options = {
    silent: false,
    env: process.env,
    cwd: projectRoot
  }
  return exec(command, options, cb)
}

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
  readDatabase
}