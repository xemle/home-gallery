/* globals gauge*/
"use strict"

const { Buffer } = require('buffer')
const fs = require('fs/promises')
const https = require('https')
const assert = require('assert')
const fetch = require('node-fetch')
const express = require('express')

const { generateId, nextPort, waitFor, runCliAsync, getBaseDir, getPath, getStorageDir, getDatabaseFilename, getEventsFilename, readDatabase } = require('../utils')

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
  const url = `${protocol}://127.0.0.1:${port}`
  servers[serverId] = {
    child,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverUrl', url)

  return waitFor(() => fetchFacade(''), 10 * 1000).catch(e => {throw new Error(`Could not start server with args: ${args}. Error ${e}`)})
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

  const url = `http://127.0.0.1:${port}`
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

  const url = `http://127.0.0.1:${port}`
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

step("Wait for database", () => waitFor(() => fetchDatabase(), 10 * 1000).catch(e => {throw new Error(`Waiting for database failed. Error ${e}`)}))

step("Wait for current database", async () => {
  const fileDatabase = await readDatabase()
  return waitFor(() => fetchDatabase()
    .then(database => {
      if (database.created != fileDatabase.created) {
        throw new Error(`Database created timestamp missmatch: Expexted ${fileDatabase.created} but was ${database.created}`)
      }
      return database
    }), 5 * 1000)
    .catch(e => {throw new Error(`Failed to fetch current database. Error ${e}`)})
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

step("Fetch database with query <query>", async (query) => {
  return fetchFacade(`/api/database.json${query}`)
    .then(res => {
      assert(res.ok, `Could not fetch database`)
      return res.json()
    })
    .then(data => gauge.dataStore.scenarioStore.put('fetched.database', data))
})

step("Fetched database has <amount> entries", async (amount) => {
  const database = gauge.dataStore.scenarioStore.get('fetched.database')
  assert(database && database.data, `Expected to have a database`)
  assert(database.data.length == amount, `Expected ${amount} entries but got ${database.data.length}`)
})

step("Fetched database with entry <index> has no property <property>", async (index, property) => {
  const database = gauge.dataStore.scenarioStore.get('fetched.database')
  assert(database && database.data && database.data.length >= +index, `Expected to have a database`)
  const entry = database.data[+index]
  assert(entry && !entry[property], `Expected emptry property ${property} but was ${entry[property]}`)
})
