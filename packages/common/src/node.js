const format = require('./format')
const fs = require('./fs')
const os = require('./os')
const utils = require('./utils')
const createHash = require('./utils/hash')

const {
  formatDate,
  humanizeBytes,
  humanizeDuration,
} = format

const {
  fileFilter,
  fileTypes,
  getFileTypeByExtension,
  mkdirp,
  readDir,
  readDirCreate,
  readJsonGzip,
  sha1Hex,
  sidecars,
  writeJsonGzip,
  writeSafe
} = fs

const {
  ProcessManager,
  run,
  spawn
} = os

const {
  callbackify,
  debounce,
  forEach,
  lruCache,
  promisify,
  rateLimit,
  serialize
} = utils

module.exports = {
  format,
    formatDate,
    humanize: humanizeBytes,
    humanizeBytes,
    humanizeDuration,

  fs,
    fileFilter,
    fileTypes,
    getFileTypeByExtension,
    mkdir: mkdirp,
    mkdirp,
    readDir,
    readDirCreate,
    readJsonGzip,
    sha1Hex,
    sidecars,
    writeJsonGzip,
    writeSafe,

  os,
    ProcessManager,
    run,
    spawn,

  utils: {...utils, createHash},
    callbackify,
    debounce,
    forEach,
    lruCache,
    promisify,
    rateLimit,
    serialize,
    createHash
}
