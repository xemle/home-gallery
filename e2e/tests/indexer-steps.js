/* globals gauge*/
"use strict";
const path = require('path')
const assert = require('assert')
const { mkdir, cp, mv, rm } = require('shelljs')
const { getTestDataDir, getFilesDir, getIndexFilename, runCli, readIndex } = require('../utils');


step("Init files from <dir>", async (dir) => {
  const filesDir = getFilesDir()
  mkdir('-p', path.dirname(filesDir))
  cp('-R', path.join(getTestDataDir(), dir), filesDir)
});

step(["Create index", "Update index"], async () => {
  const [code, command] = await runCli(['index', '-d', getFilesDir(), '-i', getIndexFilename()]);
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})

step("Add file <file>", async (file) => {
  const filesDir = getFilesDir()
  mkdir('-p', filesDir)
  cp(path.join(getTestDataDir(), file), filesDir)
})

step("Index has <amount> entries", async (amount) => {
  const data = await readIndex()
  assert(data.data.length == amount, `Expecting ${amount} entries but have ${data.data.length} entries`)
})

step("Index has entry with checksum <checksum> and filename <filename>", async (checksum, filename) => {
  const data = await readIndex()
  const entry = data.data.find(entry => entry.sha1sum.startsWith(checksum))
  assert(!!entry, `Could not find a entry with checksum ${checksum}`)
  assert(entry.filename == filename, `Expected file path to be ${filename} of entry ${checksum} but was ${entry.filename}`)
})

step("Remove file <file>", async (file) => {
  rm(path.join(getFilesDir(), file))
})

step("Rename file <file> to <other>", async (file, other) => {
  const filesDir = getFilesDir()
  mkdir('-p', path.dirname(path.join(filesDir, other)))
  mv(path.join(filesDir, file), path.join(filesDir, other))
})
