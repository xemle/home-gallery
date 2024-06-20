/* globals gauge*/
"use strict"

const { Buffer } = require('buffer')
const fs = require('fs').promises
const http = require('http')
const https = require('https')
const url = require('url')
const assert = require('assert')
const fetch = require('node-fetch')
const express = require('express')

const { generateId, nextPort, waitFor, runCliAsync, killChildProcess, getBaseDir, getPath, getStorageDir, getDatabaseFilename, getEventsFilename, readDatabase, addCliEnv, resolveProperty, parseValue, assertDeep } = require('../utils')

const serverTestHost = '127.0.0.1'
const servers = {}

const insecureOption = {
  agent: new https.Agent({
    rejectUnauthorized: false,
  })
}

const fetchFacade = (path, options = {}) => {
  const url = gauge.dataStore.scenarioStore.get('serverUrl')
  assert(!!url, `Expected serverUrl but was empty. Start server first`)

  const headers = gauge.dataStore.scenarioStore.get('request.headers') || {}
  const agent = url.startsWith('https') ? insecureOption : {}
  return fetch(`${url}${path || ''}`, Object.assign(options, {timeout: 500, headers: Object.assign({}, options.headers, headers)}, agent))
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
  const child = runCliAsync(['server', '-s', getStorageDir(), '-d', getDatabaseFilename(), '-e', getEventsFilename(), '--host', serverTestHost, '--port', port, '--no-open-browser', ...args])

  const protocol = args.includes('-K') ? 'https' : 'http'
  const url = `${protocol}://${serverTestHost}:${port}`
  servers[serverId] = {
    child,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverUrl', url)

  return waitFor(() => fetchFacade('/favicon.ico'), 10 * 1000).catch(e => {throw new Error(`Could not start server with args: ${args.join(' ')}. Error ${e}`)})
}

step("Start server", startServer)

step("Start only server", () => startServer(['--no-watch-sources']))

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

  const url = `http://${serverTestHost}:${port}`
  servers[serverId] = {
    server: false,
    port,
    url
  }
  gauge.dataStore.scenarioStore.put('serverUrl', url)

  return new Promise((resolve, reject) => {
    const server = app.listen(port, serverTestHost, (err) => {
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

  const url = `http://${serverTestHost}:${port}`
  servers[serverId] = {
    server: false,
    port,
    url
  }

  addCliEnv({
    GALLERY_API_SERVER: url,
    GALLERY_GEO_SERVER: url
  })

  return new Promise((resolve, reject) => {
    const server = app.listen(port, serverTestHost, (err) => {
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

const waitForEvent = async (eventPredicate) => {
  await waitFor(async () => {
    const events = gauge.dataStore.scenarioStore.get('events') || []
    const reloadEvent = events.find(eventPredicate)
    if (!reloadEvent) {
      return Promise.reject(new Error(`No reload event found`))
    }
  }, 25000)
}

step("Listen to server events", async () => {
  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')

  const onResponse = res => {
    res.setEncoding('utf8')
    res.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => !!line)
      let event = Object.fromEntries(lines.map(line => line.split(/:\s+/)))
      if (event.data.match(/^\{.*\}$/)) {
        event = JSON.parse(event.data)
      }
      const events = gauge.dataStore.scenarioStore.get('events') || []
      events.push(event)
      gauge.dataStore.scenarioStore.put('events', events)
    })
  }

  const headers = gauge.dataStore.scenarioStore.get('request.headers') || {}
  const agent = serverUrl.startsWith('https') ? insecureOption : undefined

  const parsedUrl = url.parse(`${serverUrl}/api/events/stream`)
  const options = {
    method: 'GET',
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    headers,
    agent
  }
  const req = http.request(options, onResponse)

  req.on('error', err => {
    gauge.message(`Listen to EventStream failed: ${err}`)
  })
  req.end()

  return waitForEvent(event => event.type == 'pong')
})

step("Reset server events", () => {
  gauge.dataStore.scenarioStore.put('events', [])
})

step("Wait for database reload event", async () => waitForEvent(event => event.type == 'server' && event.action == 'databaseReloaded'))

step("Wait for user action event", async () => waitForEvent(event => event.type == 'userAction'))

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
    .then(res => {
      gauge.dataStore.scenarioStore.put('response.status', res.status)
      if (res.ok && res.headers.get('Content-Type') && res.headers.get('Content-Type').startsWith('application/json')) {
        return res.json().then(body => {
          gauge.dataStore.scenarioStore.put('response.body', body)
        })
      }
    })
})

step("Response status is <status>", async (status) => {
  const responseStatus = gauge.dataStore.scenarioStore.get('response.status')
  assert(responseStatus == status, `Expected response status ${status} but was ${responseStatus}`)
})

step("Response body has property <property> with value <value>", async (property, value) => {
  const body = gauge.dataStore.scenarioStore.get('response.body')
  const resolvedProperty = resolveProperty(body, property)
  const parsedValue = parseValue(value)
  try {
    assertDeep(resolvedProperty, parsedValue)
  } catch (e) {
    assert(false, `Expected body property ${property} to be ${value} but: ${e}`)
  }
})

const btoa = text => Buffer.from(text).toString('base64')

step("Set user <user> with password <password>", async (user, password) => {
  const headers = gauge.dataStore.scenarioStore.get('request.headers') || {}
  headers['Authorization'] = `Basic ${btoa(user + ':' + password)}`
  gauge.dataStore.scenarioStore.put('request.headers', headers)
})

step("Set anonymous user", async () => {
  const headers = gauge.dataStore.scenarioStore.get('request.headers') || {}
  delete headers['Authorization']
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

step("Wait for log entry with key <key> and value <value>", async (key, value) => {
  const logFile = getPath('e2e.log')
  await waitFor(async () => {
    const data = await fs.readFile(logFile, 'utf-8')
    const entries = data.split(/\n/g).filter(v => !!v).map(line => JSON.parse(line))

    const values = entries.map(mapValuesByKey(key)).filter(v => !!v)
    if (!values.length) {
      return Promise.reject(new Error(`Could not find ${key} with value ${value}`))
    }
  }, 2000)
})

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

step("Post user event to tag <id> with <tag>", async (id, tag) => {
  const ids = id.split(',')
  const baseUuid = 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'
  const event = {
    id: baseUuid.replace(/[x]/g, (_, pos) => ids[0][pos % ids[0].length]),
    type: 'userAction',
    targetIds: ids,
    actions: tag.split(',').map(t => { return { action: tag.startsWith('-') ? 'removeTag' : 'addTag', value: tag.replace(/^-/, '') } }),
    date: '2023-11-08T07:48:57.248+01:00'
  }
  fetchFacade('/api/events', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })
})