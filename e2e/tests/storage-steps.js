/* globals gauge*/
const path = require('path');
const assert = require("assert");
const { ls } = require('shelljs')

const { getStorageDir } = require('../utils');

step("Storage has entry <name> for <id>", async (name, id) => {
  const entryDir = path.join(getStorageDir(), id.substr(0, 2), id.substr(2, 2), `${id.substr(4)}*`)
  const files = ls(entryDir)
    .map(file => path.basename(file))
    .map(file => file.replace(/^[^-]+-/, ''))
  const hasFile = files.indexOf(name) >= 0
  assert(hasFile, `Expected ${name} storage file, but found only: ${files.join(', ')}`)
})