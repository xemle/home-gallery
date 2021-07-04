/* globals gauge*/
"use strict";
const fs = require('fs/promises')
const path = require('path')
const { mkdir, cp, mv, rm } = require('shelljs')
const assert = require("assert")

const { getTestDataDir, getFilesDir } = require('../utils')

step("Exit code was <code>", (code) => {
  const lastCode = gauge.dataStore.scenarioStore.get('lastExitCode')
  assert(lastCode == code, `Expected exit code to be ${code} but was ${lastCode}`)
})

step("Init files from <dir>", async (dir) => {
  const filesDir = getFilesDir()
  mkdir('-p', path.dirname(filesDir))
  cp('-R', path.join(getTestDataDir(), dir), filesDir)
});

step("Add file <file>", async (file) => {
  const filesDir = getFilesDir()
  mkdir('-p', filesDir)
  cp(path.join(getTestDataDir(), file), filesDir)
})

step("Add file <file> as <target>", async (file, target) => {
  const dst = path.join(getFilesDir(), target)
  mkdir('-p', path.dirname(dst))
  cp(path.join(getTestDataDir(), file), dst)
})

step("Add file <file> with content <content>", async (file, content) => {
  const target = path.join(getFilesDir(), file)
  mkdir('-p', path.dirname(target))
  await fs.writeFile(target, content, 'utf8')
})

step("Remove file <file>", async (file) => {
  rm(path.join(getFilesDir(), file))
})

step("Rename file <file> to <other>", async (file, other) => {
  const filesDir = getFilesDir()
  mkdir('-p', path.dirname(path.join(filesDir, other)))
  mv(path.join(filesDir, file), path.join(filesDir, other))
})
