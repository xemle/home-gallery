/* globals gauge*/
"use strict";
const fs = require('fs').promises
const path = require('path')
const { mkdir, cp, mv, rm } = require('shelljs')
const assert = require("assert")
const exiftool = require('exiftool-vendored').exiftool

const { getTestDataDir, getBaseDir, getFilesDir } = require('../utils')

step("Exit code was <code>", (code) => {
  const lastCode = gauge.dataStore.scenarioStore.get('lastExitCode')
  assert(lastCode == code, `Expected exit code to be ${code} but was ${lastCode}`)
})

step("Init files dir", async () => {
  mkdir('-p', getFilesDir())
})

step("Init dir from <dir>", async (dir) => {
  const baseDir = getBaseDir()
  mkdir('-p', baseDir)
  cp('-R', path.join(getTestDataDir(), dir, '*'), baseDir)
});

step("Init files from <dir>", async (dir) => {
  const filesDir = getFilesDir()
  mkdir('-p', filesDir)
  cp('-R', path.join(getTestDataDir(), dir, '*'), filesDir)
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

step("Add file <file> as <target> to root", async (file, target) => {
  const dst = path.join(getBaseDir(), target)
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

step("File <file> does not exist", async (file) => {
  const exist = await fs.access(path.join(getFilesDir(), file)).then(() => true).catch(() => false)
  assert(exist === false, `Expected no such file ${file} but does exist`)
})

step("Rename file <file> to <other>", async (file, other) => {
  const filesDir = getFilesDir()
  mkdir('-p', path.dirname(path.join(filesDir, other)))
  mv(path.join(filesDir, file), path.join(filesDir, other))
})

step("File <file> has tags <tags>", async (file, tags) => {
  const exif = await exiftool.read(path.join(getFilesDir(), file))
  assert.deepEqual(exif.TagsList, tags.split(','), `Expected to be ${tags} but was ${exif.TagsList}`)
})

step("Replace <pattern> in <file> with <text>", async (pattern, file, text) => {
  const data = await fs.readFile(path.join(getBaseDir(), file), 'utf8')
  const pos = data.indexOf(pattern)
  if (pos >= 0) {
    data = data.substring(0, pos) + text + data.substring(pos + pattern.length)
    await fs.writeFile(path.join(getBaseDir(), file), data, 'utf8')
  }
})