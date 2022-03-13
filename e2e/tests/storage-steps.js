/* globals gauge*/
const path = require('path')
const assert = require("assert")
const { ls, test } = require('shelljs')

const { getStorageDir } = require('../utils')

const getEntryFiles = id => {
  const entryDir = path.join(id.substr(0, 2), id.substr(2, 2))
  if (!test('-d', path.join(getStorageDir(), entryDir))) {
    return []
  }
  return ls(path.join(getStorageDir(), entryDir, `${id.substr(4)}*`))
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
