/* globals gauge*/
const path = require('path')
const assert = require("assert")
const fs = require('fs').promises
const sizeOf = require('image-size')

const { getStorageDir, getDatabaseFilename, runCli } = require('../utils')

const getFiles = async id => {
  const files = await fs.readdir(path.resolve(getStorageDir(), id.substr(0, 2), id.substr(2, 2)))
    .catch(() => [])
  return files.filter(file => file.startsWith(id.substr(4)))
}

const getEntryFiles = async id => {
  const files = await getFiles(id)
  return files.map(file => file.replace(/^[^-]+-/, ''))
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
  const files = await getFiles(id)
  const file = files.find(filename => filename.includes(name))
  assert(file != null, `Expected no ${name} storage file, but found: ${files.join(', ')} for id ${id}`)
  const dimensions = sizeOf(file)
  const [width, height] = size.split('x')
  assert(width == dimensions.width && height == dimensions.height, `Expected size of ${name} to be ${size} but was ${dimensions.width}x${dimensions.height}`)
})

step("Purge storage", async () => {
  return runCli(['storage', '-s', getStorageDir(), 'purge', '-d', getDatabaseFilename()])
})
