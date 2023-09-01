const fs = require('fs').promises
const path = require('path')
const assert = require('assert')
const fetch = require('node-fetch')

const { getEventsFilename } = require('../utils');

step('Fetching events has status <status>', async (status) => {
  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')
  return fetch(`${serverUrl}/api/events`)
    .then(res => {
      assert(res.status == status, `Expected status code ${status} but was ${res.status}`)
    })
})

const createUUID = () => {
  return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, () => {
    const r = Math.floor((Math.random() * 16))
    return r < 10 ? String.fromCharCode(48 + r) : String.fromCharCode(87 + r)
  })
}

const createUserAction = (tag, id) => {
  return {
    id: createUUID(),
    type: 'userAction',
    targetIds: id.split(','),
    actions: tag.split(',').map(t => { return { action: tag.startsWith('-') ? 'removeTag' : 'addTag', value: tag.replace(/^-/, '') } }),
    date: new Date().toISOString()
  }
}

step('Post tag event with <tag> for media <id>', async (tag, id) => {
  const event = createUserAction(tag, id)

  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')
  await fetch(`${serverUrl}/api/events`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })
})

step('Init event database with type <type>', async (type) => {
  const eventFile = getEventsFilename()

  const exists = await fs.access(eventFile).then(() => true).catch(() => false)
  assert(!exists, `Expect non existing event file to initialize it`)
  await fs.mkdir(path.dirname(eventFile), {recursive: true})
  const header = {
    type,
    created: new Date().toISOString()
  }
  const data = JSON.stringify(header) + '\n'

  await fs.appendFile(eventFile, data)
})

step('Append tag event with <tag> for media <id>', async (tag, id) => {
  const event = createUserAction(tag, id)
  const eventFile = getEventsFilename()

  const exists = await fs.access(eventFile).then(() => true).catch(() => false)

  let data = JSON.stringify(event) + '\n'
  if (!exists) {
    await fs.mkdir(path.dirname(eventFile), {recursive: true})
    const header = {
      type: 'home-gallery/events@1.0',
      created: new Date().toISOString()
    }
    data = JSON.stringify(header) + '\n' + data
  }

  await fs.appendFile(eventFile, data)
})

step('Event database has <amount> events', async (amount) => {
  const eventFile = getEventsFilename()

  const exists = await fs.access(eventFile).then(() => true).catch(() => false)

  assert(exists, `Expected event file ${eventFile} but was not found`)

  const buffer = await fs.readFile(eventFile)
  const lines = buffer.toString('utf-8')
    .split('\n')
    .filter(line => !!line)

  assert(lines.length - 1 == amount, `Expedted to have ${amount} but was ${lines.length - 1}`)
})