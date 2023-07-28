/* globals gauge*/
"use strict"
const fs = require('fs').promises
const path = require('path')
const Yaml = require('yaml')
const { addCliEnv, getBaseDir, getPath, getFilesDir, getConfigFilename, runCliAsync, runCli } = require('../utils')

step("Set test env", async () => {
  addCliEnv({
    GALLERY_CONFIG: getConfigFilename(),
    GALLERY_CONFIG_DIR: getPath('config'),
    GALLERY_CACHE_DIR: getBaseDir()
  })
})

step("Init config", async () => {
  await runCli(['run', 'init', '--config', getConfigFilename(), '--source', getFilesDir()])
})

const readConfig = async filename => {
  const yml = await fs.readFile(filename, 'utf-8')
  try {
    return Yaml.parse(yml)
  } catch (e) {
    return Promise.reject(e)
  }
}

const writeConfig = async (filename, config) => fs.writeFile(filename, Yaml.stringify(config))

const getSegement = (object, key) => {
  const parts = key.split('.')
  let segment = object
  for (let i = 0; i < parts.length - 1; i++) {
    if (!segment[parts[i]] || typeof segment[parts[i]] != 'object') {
      segment[parts[i]] = {}
    }
    segment = segment[parts[i]]
  }
  return [segment, parts[parts.length - 1]]
}

step("Set config <key> to <value>", async (key, jsonValue) => {
  const filename = getConfigFilename()
  const config = await readConfig(filename)

  const [segment, name] = getSegement(config, key)
  try {
    segment[name] = JSON.parse(jsonValue)
  } catch (e) {
    segment[name] = `${jsonValue}`
  }

  await writeConfig(filename, config)
})

step("Run import with <args>", async (args) => {
  const argList = args.split(/\s+/)
  await runCli(['run', 'import', '--config', getConfigFilename(), ...argList])
})

const runImport = async args => await runCli(['run', 'import', '--config', getConfigFilename(), ...args])

step("Run intital import", async () => runImport(['--initial']))

step("Run update import", async () => runImport(['--update']))

step("Run full import", async () => runImport([]))

step("Run import in watch mode", async () => {
  const onExit = () => {
    gauge.dataStore.scenarioStore.put('importWatchChild', null)
  }
  const child = runCliAsync(['run', 'import', '--config', getConfigFilename(), '--update', '--watch', '--watch-max-delay', '0'], onExit)
  gauge.dataStore.scenarioStore.put('importWatchChild', child)
})

step("Wait for watch for idle", async () => {
  const child = gauge.dataStore.scenarioStore.get('importWatchChild')
  if (!child) {
    return
  }
  gauge.message(`Child PID is ${child.pid}`)
  return new Promise((resolve, reject) => {
    let pollIntervalId
    let timeoutTimerId

    function cleanup() {
      clearTimeout(timeoutTimerId)
      clearInterval(pollIntervalId)
      child.stdout.off('data', onData)
    }

    function onData(chunk) {
      const data = chunk.toString()
      if (data.match(/File watcher status: idle/)) {
        cleanup()
        resolve()
      }
    }

    child.stdout.on('data', onData)

    pollIntervalId = setInterval(() => {
      process.kill(child.pid, 'SIGUSR1')
    }, 100)

    timeoutTimerId = setTimeout(() => {
      cleanup()
      reject(new Error(`Timeout exceeded for idle state of file watcher`))
    }, 20 * 1000)
  })
})

step("Stop import", async() => {
  const child = gauge.dataStore.scenarioStore.get('importWatchChild')
  if (!child) {
    return
  }

  return new Promise((resolve) => {
    let timerId
    child.on('exit', () => {
      clearTimeout(timerId)
      resolve()
    })

    timerId = setTimeout(() => {
      process.kill(child.pid, 'SIGKILL')
    }, 3000)

    process.kill(child.pid, 'SIGINT')
  })
})
