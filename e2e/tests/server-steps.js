const https = require('https');
const assert = require("assert")
const fetch = require('node-fetch')
const express = require('express')

const { generateId, runCliAsync, getBaseDir, getPath, getStorageDir, getDatabaseFilename, getEventsFilename } = require('../utils')

const servers = {}

const wait = async ms => new Promise(resolve => setTimeout(resolve, ms))

const onResponseNoop = res => res

const insecureOption = {
  agent: new https.Agent({
    rejectUnauthorized: false,
  })
}

const waitForUrl = async (url, timeout, onResponse) => {
  timeout = timeout || 10 * 1000
  const startTime = Date.now()

  const next = async () => {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Wait timeout exceeded for url: ${url}`)
    }
    return fetch(url, url.startsWith('https') ? insecureOption : {})
      .then(onResponse || onResponseNoop)
      .catch(() => wait(200).then(next))
  }

  return next()
}

const waitForDatabase = async (url, timeout) => {
  return waitForUrl(`${url}/api/database.json`, timeout, res => {
    if (!res.ok) {
      throw new Error(`Database response is not successfull: Code is ${res.status}`)
    }
    return res.json().then(database => {
      if (!database.data.length) {
        return Promise.reject(new Error(`Database is empty`))
      }
      return database
    })
  })
}

const startServer = async (args = []) => {
  const serverId = generateId(4)
  const port = gauge.dataStore.scenarioStore.get('port')
  const child = runCliAsync(['server', '-s', getStorageDir(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), '--port', port, '--no-open-browser', ...args])

  const protocol = args.includes('-K') ? 'https' : 'http'
  const url = `${protocol}://localhost:${port}`
  servers[serverId] = {
    child,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverId', serverId)
  gauge.dataStore.scenarioStore.put('serverUrl', url)

  return waitForUrl(url, 10 * 1000)
}
step("Start server", startServer)

step("Start HTTPS server", async () => startServer(['-K', getPath('config', 'server.key'), '-C', getPath('config', 'server.crt')]))

step("Start static server", async () => {
  const serverId = generateId(4)
  const port = gauge.dataStore.scenarioStore.get('port')

  const app = express()
  app.use(express.static(getBaseDir()))

  const url = `http://localhost:${port}`
  servers[serverId] = {
    server: false,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverId', serverId)
  gauge.dataStore.scenarioStore.put('serverUrl', url)

  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        return reject(err)
      }
      servers[serverId].server = server;
      resolve()
    })
  })
})

step("Start mock server", async () => {
  const serverId = generateId(4)
  const port = gauge.dataStore.scenarioStore.get('port')

  const mockApiServer = (req, res, next) => {
    const paths = ['/faces', '/objects', '/embeddings']
    if (!paths.includes(req.path)) {
      return next()
    }
    return res.json({data:[]})
  }

  const mockGeoServer = (req, res, next) => {
    const paths = ['/reverse']
    if (!paths.includes(req.path)) {
      return next()
    }
    return res.json({
      osm_type: 'way',
      address: {
        road: 'Strada Provinciale SP286 Santa Caterina - Sant\'Isidoro - Porto Cesareo',
        town: 'Nardò',
        county: 'Lecce',
        state: 'Apulien',
        postcode: '73048',
        country: 'Italien',
        country_code: 'it'
      }
    })
  }

  const app = express()
  app.use(mockApiServer)
  app.use(mockGeoServer)

  const url = `http://localhost:${port}`
  servers[serverId] = {
    server: false,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverId', serverId)
  gauge.dataStore.scenarioStore.put('serverUrl', url)
  gauge.dataStore.scenarioStore.put('apiServerUrl', url)
  gauge.dataStore.scenarioStore.put('geoServerUrl', url)

  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        return reject(err)
      }
      servers[serverId].server = server;
      resolve()
    })
  })
})

step("Wait for database", async () => {
  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')
  await waitForDatabase(serverUrl, 10 * 1000)
})

const killChildProcess = async child => {
  return new Promise(resolve => {
    const id = setTimeout(() => {
      child.kill('SIGKILL')
    }, 1000)

    child.on('exit', () => {
      clearTimeout(id)
      resolve()
    })
    child.kill('SIGTERM')
  })
}

step("Stop server", async () => {
  const serverId = gauge.dataStore.scenarioStore.get('serverId')
  const server = servers[serverId]
  assert(!!server, `Server ${serverId} not found`)

  delete servers[serverId]
  if (server.child) {
    return killChildProcess(server.child)
  } else if (server.server) {
    server.server.close()
  }
})

step("Server has file <file>", async (file) => {
  const serverId = gauge.dataStore.scenarioStore.get('serverId')
  const server = servers[serverId]
  assert(!!server, `Server ${serverId} not found`)

  return fetch(`${server.url}${file}`, {timeout: 500})
    .then(res => {
      assert(res.ok, `Could not fetch ${fetch}`)
    })
})

step("Database with query <query> has <amount> entries", async (query, amount) => {
  const serverId = gauge.dataStore.scenarioStore.get('serverId')
  const server = servers[serverId]
  assert(!!server, `Server ${serverId} not found`)

  return fetch(`${server.url}/api/database${query}`, {timeout: 500})
    .then(res => {
      assert(res.ok, `Could not fetch ${fetch}`)
      return res.json()
    })
    .then(data => {
      assert(data.data.length == amount, `Expected ${amount} entries but got ${data.data.length}`)
    })
})
