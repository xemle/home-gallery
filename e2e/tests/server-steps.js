const assert = require("assert")
const fetch = require('node-fetch')

const { generateId, runCliAsync, getStorageDir, getDatabaseFilename, getEventsFilename } = require('../utils')

const servers = {}

const wait = async ms => new Promise(resolve => setTimeout(resolve, ms))

const waitForUrl = async (url, timeout) => {
  const startTime = Date.now()

  const next = async () => {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Wait timeout exceeded for url: ${url}`)
    }
    return fetch(url)
      .catch(() => wait(200).then(next))
  }

  return next()
}

step("Start server", async () => {
  const serverId = generateId(4)
  const port = gauge.dataStore.scenarioStore.get('port')
  const child = runCliAsync(['server', '-s', getStorageDir(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), '--port', port, '--no-open-browser'])

  const url = `http://localhost:${port}`
  servers[serverId] = {
    child,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverId', serverId)

  return waitForUrl(url, 10 * 1000)
})

step("Stop server", async () => {
  const serverId = gauge.dataStore.scenarioStore.get('serverId')
  const server = servers[serverId]
  assert(!!server, `Server ${serverId} not found`)

  return new Promise(resolve => {
    const id = setTimeout(() => {
      server.child.kill('SIGKILL')
    }, 1000)

    server.child.on('exit', () => {
      clearTimeout(id)
      resolve()
    })
    server.child.kill('SIGTERM')

    delete servers[serverId]
  })
})

step("Server has file <file>", async (file) => {
  const serverId = gauge.dataStore.scenarioStore.get('serverId')
  const server = servers[serverId]
  assert(!!server, `Server ${serverId} not found`)

  return fetch(server.url, {timeout: 500})
    .then(res => {
      if (!res.ok) {
        throw new Error(`Could not fetch ${file}`)
      }
    })
})