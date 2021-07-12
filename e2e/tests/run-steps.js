/* globals gauge*/
"use strict"
const path = require('path')
const { getBaseDir, getFilesDir, getConfigFilename, runCli } = require('../utils')

step("Init config", async () => {
  await runCli(['run', 'init', '--config', getConfigFilename(), '--source', getFilesDir()])
})

step("Run import with <args>", async (args) => {
  const argList = args.split(/\s+/)
  await runCli(['run', 'import', '--config', getConfigFilename(), ...argList])
})

const getOptions = () => {
  return {
    env: {
      'GALLERY_CONFIG_DIR': path.join(getBaseDir(), 'config'),
      'GALLERY_CACHE_DIR': getBaseDir()
    }
  }
}

const runImport = async args => await runCli(['run', 'import', '--config', getConfigFilename(), ...args], getOptions())

step("Run intital import", async () => runImport(['--initial']))

step("Run update import", async () => runImport(['--update']))

step("Run full import", async () => runImport([]))
