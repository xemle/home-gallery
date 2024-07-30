/* globals gauge*/
"use strict"

const { getConfigFilename, runCliAsync, runCli } = require('../utils')

const runImport = async args => await runCli(['run', 'import', '--config', getConfigFilename(), ...args])

step("Run import with <args>", async (args) => runImport(args.split(/\s+/)))

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
