const fs = require('fs').promises
const path = require('path')
const http = require('http')
const assert = require('assert')
const crypto = require('crypto')

const { getEventsFilename } = require('../utils');

const createUserAction = (tag, id) => {
  return {
    id: crypto.randomUUID().toString(),
    type: 'userAction',
    targetIds: id.split(','),
    actions: tag.split(',').map(t => ({action: t.startsWith('-') ? 'removeTag' : 'addTag', value: t.replace(/^-/, '')})),
    date: new Date().toISOString()
  }
}

step('Post tag event with <tag> for media <id>', async (tag, id) => {
  const event = createUserAction(tag, id)

  const serverUrl = gauge.dataStore.scenarioStore.get('serverUrl')
  return new Promise((resolve, reject) => {
    const req = http.request(`${serverUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300
    }, res => {
      const ok = res.statusCode >= 200 && res.statusCode < 300
      res.resume()
      res.on('end', () => ok ? resolve() : reject(new Error(`Failed to post event with status ${res.statusCode}`)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.write(JSON.stringify(event))
    req.end()
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