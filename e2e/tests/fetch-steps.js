/* globals gauge*/
"use strict"
const path = require('path')
const { runCli, getDatabaseFilename, getStorageDir, getEventsFilename } = require('../utils')

step("Use file space <space>", async (space) => {
  const baseDirOrig = gauge.dataStore.scenarioStore.get('baseDirOrig')
  if (!baseDirOrig) {
    const baseDir = gauge.dataStore.scenarioStore.get('baseDir')
    gauge.dataStore.scenarioStore.put('baseDirOrig', baseDir)
    gauge.dataStore.scenarioStore.put('baseDir', path.join(baseDir, space) )
  } else {
    gauge.dataStore.scenarioStore.put('baseDir', path.join(baseDirOrig, space) )
  }
})

const fetch = async (args = []) => {
  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')
  await runCli(['fetch', '-d', getDatabaseFilename(), '-s', getStorageDir(), '-e', getEventsFilename(), '-r', serverUrl, ...args])
}
step("Fetch", fetch)

step("Fetch with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return fetch(argList)
})
