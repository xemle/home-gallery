/* globals gauge*/
const path = require('path')
const assert = require("assert")
const { ls, test } = require('shelljs')
const sizeOf = require('image-size')

const { getStorageDir } = require('../utils')

const getFiles = id => {
  const entryDir = path.join(id.substr(0, 2), id.substr(2, 2))
  if (!test('-d', path.join(getStorageDir(), entryDir))) {
    return []
  }
  return ls(path.join(getStorageDir(), entryDir, `${id.substr(4)}*`))
}

const getEntryFiles = id => {
  return getFiles(id)
    .map(file => path.basename(file))
    .map(file => file.replace(/^[^-]+-/, ''))
}

step("Storage has entry <name> for <id>", async (name, id) => {
  const files = getEntryFiles(id)
  const hasFile = files.indexOf(name) >= 0
  assert(hasFile, `Expected ${name} storage file, but found only: ${files.join(', ')} for id ${id}`)
})

step("Storage has no entry for <id>", async (id) => {
  const files = getEntryFiles(id)
  assert(!files.length, `Expect storage files to be empty but was ${files} for id ${id}`)
})

step("Storage has no entry <name> for <id>", async (name, id) => {
  const files = getEntryFiles(id)
  const hasFile = files.indexOf(name) < 0
  assert(hasFile, `Expected no ${name} storage file, but found: ${files.join(', ')} for id ${id}`)
})

step("Storage image <name> for <id> has size <size>", async (name, id, size) => {
  const files = getFiles(id)
  const file = files.find(filename => filename.includes(name))
  assert(file != null, `Expected no ${name} storage file, but found: ${files.join(', ')} for id ${id}`)
  const dimensions = sizeOf(file)
  const [width, height] = size.split('x')
  assert(width == dimensions.width && height == dimensions.height, `Expected size of ${name} to be ${size} but was ${dimensions.width}x${dimensions.height}`)
})
