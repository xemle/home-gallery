/* globals gauge*/
"use strict"
const path = require('path')
const { runCli, runCliAsync, killChildProcess, getDatabaseFilename, getStorageDir, getEventsFilename } = require('../utils')

const fetchProcesses = {}

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

const fetchArgs = (args = []) => {
  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')
  return ['fetch', '-u', serverUrl, '-d', getDatabaseFilename(), '-s', getStorageDir(), '-e', getEventsFilename(), ...args]
}

const fetch = async (args = []) => {
  await runCli(fetchArgs(args))
}

step("Fetch", fetch)

step("Fetch with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return fetch(argList)
})

step("Fetch with watch", async () => {
  const child = runCliAsync(fetchArgs(['--watch']))
  gauge.dataStore.scenarioStore.put('fetchPid', child.pid)
  fetchProcesses[child.pid] = { child }

  child.on('exit', () => {
    delete fetchProcesses[child.pid]
    gauge.dataStore.scenarioStore.put('fetchPid', undefined)
  })
})

step("Stop fetch", async () => {
  const fetchPid = gauge.dataStore.scenarioStore.get('fetchPid')

  const { child } = fetchProcesses[fetchPid]
  if (!child) {
    return
  }

  await killChildProcess(child)
})
