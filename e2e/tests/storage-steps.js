/* globals gauge*/
const path = require('path')
const assert = require("assert")
const fs = require('fs').promises
const sizeOf = require('image-size')
const exiftool = require('exiftool-vendored').exiftool

const { getStorageDir, getDatabaseFilename, runCli } = require('../utils')

const getFiles = async id => {
  const files = await fs.readdir(path.resolve(getStorageDir(), id.substr(0, 2), id.substr(2, 2)))
    .catch(() => [])
  return files
    .filter(file => file.startsWith(id.substr(4)))
    .map(file => path.join(id.substr(0, 2), id.substr(2, 2), file))
}

const getEntryFiles = async id => {
  const files = await getFiles(id)
  return files.map(file => path.basename(file).replace(/^[^-]+-/, ''))
}

const getEntryFile = async (id, name) => {
  const files = await getFiles(id)
  return files.find(filename => filename.includes(name))
}

step("Storage has entry <name> for <id>", async (name, id) => {
  const files = await getEntryFiles(id)
  const hasFile = files.indexOf(name) >= 0
  assert(hasFile, `Expected ${name} storage file, but found only: ${files.join(', ')} for id ${id}`)
})

step("Storage has no entry for <id>", async (id) => {
  const files = await getEntryFiles(id)
  assert(!files.length, `Expect storage files to be empty but was ${files} for id ${id}`)
})

step("Storage has no entry <name> for <id>", async (name, id) => {
  const files = await getEntryFiles(id)
  const hasFile = files.indexOf(name) < 0
  assert(hasFile, `Expected no ${name} storage file, but found: ${files.join(', ')} for id ${id}`)
})

step("Storage image <name> for <id> has size <size>", async (name, id, size) => {
  const file = await getEntryFile(id, name)
  assert(file != null, `No ${name} entry for ${id}`)
  const dimensions = sizeOf(path.resolve(getStorageDir(), file))
  const [width, height] = size.split('x')
  assert(width == dimensions.width && height == dimensions.height, `Expected size of ${name} to be ${size} but was ${dimensions.width}x${dimensions.height}`)
})

step("Storage entry <entry> for <id> has exif value <value> for <key>", async (name, id, value, key) => {
  const file = await getEntryFile(id, name)
  assert(file != null, `No ${name} entry for ${id}`)
  const tags = await exiftool.read(path.resolve(getStorageDir(), file))
  assert(tags[key] == value, `Expected that ${key} is ${value} but was ${tags[key]}`)
})

step("Purge storage", async () => {
  return runCli(['storage', '-s', getStorageDir(), 'purge', '-d', getDatabaseFilename()])
})

step("Purge storage with args <args>", async (args) => {
  return runCli(['storage', '-s', getStorageDir(), 'purge', '-d', getDatabaseFilename(), ...args.split(/\s+/)])
})
