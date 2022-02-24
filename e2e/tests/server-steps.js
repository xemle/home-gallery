/* globals gauge*/
"use strict"

const { Buffer } = require('buffer')
const fs = require('fs/promises')
const https = require('https')
const assert = require('assert')
const fetch = require('node-fetch')
const express = require('express')

const { generateId, nextPort, runCliAsync, getBaseDir, getPath, getStorageDir, getDatabaseFilename, getEventsFilename, readDatabase } = require('../utils')

const servers = {}

const insecureOption = {
  agent: new https.Agent({
    rejectUnauthorized: false,
  })
}

const fetchFacade = path => {
  const url = gauge.dataStore.scenarioStore.get('serverUrl')
  assert(!!url, `Expected serverUrl but was empty. Start server first`)

  const headers = gauge.dataStore.scenarioStore.get('request.headers') || {}
  const agent = url.startsWith('https') ? insecureOption : {}
  return fetch(`${url}${path || ''}`, Object.assign({timeout: 500, headers}, agent))
}

const fetchDatabase = () => fetchFacade('/api/database.json')
  .then(res => res.ok ? res : Promise.reject(`Response code is not successfull`))
  .then(res => res.json())
  .then(database => {
    if (!database.data.length) {
      throw new Error(`Database is empty`)
    }
    return database
  })

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const waitFor = async (testFn, timeout) => {
  timeout = timeout || 10 * 1000
  const startTime = Date.now()
  let delay = 10

  const next = async () => {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Wait timeout exceeded for path: ${path}`)
    }
    return testFn().catch(() => {
      delay = Math.min(500, delay * 2)
      return wait(delay).then(next)
    })
  }

  return next()
}

const createServerId = () => {
  const serverId = generateId(4)
  const serverIds = gauge.dataStore.scenarioStore.get('serverIds') || []
  gauge.dataStore.scenarioStore.put('serverIds', [...serverIds, serverId])
  return serverId
}

const startServer = async (args = []) => {
  const serverId = createServerId()
  const port = await nextPort()
  const child = runCliAsync(['server', '-s', getStorageDir(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), '--port', port, '--no-open-browser', ...args])

  const protocol = args.includes('-K') ? 'https' : 'http'
  const url = `${protocol}://localhost:${port}`
  servers[serverId] = {
    child,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverUrl', url)

  return waitFor(() => fetchFacade(''), 10 * 1000)
}

step("Start server", startServer)

step("Start server with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  await startServer(argList)
})

step("Start HTTPS server", async () => startServer(['-K', getPath('config', 'server.key'), '-C', getPath('config', 'server.crt')]))

step("Start static server", async () => {
  const serverId = createServerId()
  const port = await nextPort()

  const app = express()
  app.use(express.static(getBaseDir()))

  const url = `http://localhost:${port}`
  servers[serverId] = {
    server: false,
    port,
    url
  }
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
  const serverId = createServerId()
  const port = await nextPort()

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

step("Wait for database", async () => await waitFor(() => fetchDatabase(), 10 * 1000))

step("Wait for current database", async () => {
  const fileDatabase = await readDatabase()
  return waitFor(() => fetchDatabase()
    .then(database => {
      if (database.created != fileDatabase.created) {
        throw new Error(`Database created missmatch`)
      }
      return database
    }), 5 * 1000)
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

const stopServer = async serverId => {
  const server = servers[serverId]
  assert(!!server, `Server ${serverId} not found`)

  delete servers[serverId]
  if (server.child) {
    return killChildProcess(server.child)
  } else if (server.server) {
    server.server.close()
  }
}

step("Stop server", async () => {
  const serverIds = gauge.dataStore.scenarioStore.get('serverIds') || []
  await Promise.all(serverIds.map(id => stopServer(id)))
})

step("Request file <file>", async (file) => {
  return fetchFacade(file)
    .then(res => gauge.dataStore.scenarioStore.put('response.status', res.status))
})

step("Response status is <status>", async (status) => {
  const responseStatus = gauge.dataStore.scenarioStore.get('response.status')
  assert(responseStatus == status, `Expected response status ${status} but was ${responseStatus}`)
})

const btoa = text => Buffer.from(text).toString('base64')

step("Set user <user> with password <password>", async (user, password) => {
  const headers = gauge.dataStore.scenarioStore.get('request.headers') || {}
  headers['Authorization'] = `Basic ${btoa(user + ':' + password)}`
  gauge.dataStore.scenarioStore.put('request.headers', headers)
})

step("Server has file <file>", async (file) => {
  return fetchFacade(file)
    .then(res => {
      assert(res.ok, `Could not fetch file ${file}`)
    })
})

const mapValuesByKey = key => {
  const parts = key.split('.')
  return entry => {
    let result = entry
    let i = 0
    while (i < parts.length && result !== undefined) {
      result = result[parts[i++]]
    }
    return result
  }
}

step("Log has entry with key <key> and value <value>", async (key, value) => {
  const logFile = getPath('e2e.log')
  const data = await fs.readFile(logFile, 'utf-8')
  const entries = data.split(/\n/g).filter(v => !!v).map(line => JSON.parse(line))

  const values = entries.map(mapValuesByKey(key)).filter(v => !!v)
  const matches = values.filter(v => v == value)
  assert(matches.length, `Could not find any log entry with key ${key} and value '${value}' but found ${values.map(v => `'${v}'`).join(', ')}`)
})

step("Database with query <query> has <amount> entries", async (query, amount) => {
  return fetchFacade(`/api/database${query}`)
    .then(res => {
      assert(res.ok, `Could not fetch file ${fetch}`)
      return res.json()
    })
    .then(data => {
      assert(data.data.length == amount, `Expected ${amount} entries but got ${data.data.length}`)
    })
})
