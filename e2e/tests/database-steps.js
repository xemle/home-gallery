const { stat, access } = require('fs').promises
const assert = require("assert");

const { getIndexFilename, getStorageDir, getDatabaseFilename, runCli, readDatabase, waitFor, pathToPlatformPath, getEventsFilename, resolveProperty, parseValue, assertDeep } = require('../utils');

step('Database does not exist', async () => {
  const exists = await access(getDatabaseFilename()).then(() => true).catch(() => false)

  assert(!exists, `Expected database file ${getDatabaseFilename()} does not exist but found it`)
})

step("Create database", async () => {
  const {code, stdout, stderr} = await runCli(['database', '-i', getIndexFilename(), '-s', getStorageDir(), '-d', getDatabaseFilename()]);
  const command = gauge.dataStore.scenarioStore.get('lastCommand')

  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}: output: ${stdout}, err: ${stderr}`)
})

step("Create database with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return runCli(['database', '-i', getIndexFilename(), '-s', getStorageDir(), '-d', getDatabaseFilename(), ...argList]);
})

step("Database has <amount> entries", async (amount) => {
  const data = await readDatabase()
  assert(data.data.length == amount, `Expecting ${amount} entries but have ${data.data.length} entries`)
})

const getAllEntries = async id => {
  const data = await readDatabase()
  const entries = data.data.filter(entry => entry.id.startsWith(id))
  return entries
}

const getEntry = async id => {
  const entries = await getAllEntries(id)
  const entry = entries.shift()
  assert(!!entry, `Could not find entry with id ${id}`)
  return entry
}

step("Database entry <id> has property <property> with value <value>", async (id, property, value) => {
  const entry = await getEntry(id)
  const resolvedProperty = resolveProperty(entry, property)
  const parsedValue = parseValue(value)
  try {
    assertDeep(resolvedProperty, parsedValue)
  } catch (e) {
    assert(false, `Expected property ${property} of entry ${id} to be ${value} but: ${e}`)
  }
})

const toRegExp = pattern => {
  const firstSlash = pattern.indexOf('/')
  const lastSlash = pattern.lastIndexOf('/')
  if (firstSlash != 0 || lastSlash == firstSlash) {
    return new RegExp('invalid')
  } else {
    return new RegExp(pattern.substring(firstSlash + 1, lastSlash), pattern.substring(lastSlash + 1))
  }
}

step("Database entry <id> has property <property> which matches <pattern>", async (id, property, pattern) => {
  const entry = await getEntry(id)
  const resolvedProperty = resolveProperty(entry, property)
  assert(resolvedProperty && `${resolvedProperty}`.match(toRegExp(pattern)), `Expected property ${property} of entry ${id} to match ${pattern}. It is ${resolvedProperty}`)
})

step("Database entry <id> has no property <property>", async (id, property) => {
  const entry = await getEntry(id)
  const resolvedProperty = resolveProperty(entry, property)
  assert(!resolvedProperty, `Expected property ${property} of entry ${id} to be empty but was ${resolvedProperty}`)
})

step("Database entry <id> has <amount> files", async (id, amount) => {
  const entry = await getEntry(id)
  assert(entry.files.length == amount, `Expected ${amount} files but has ${entry.files.length}`)
})

step("Database entry <id> has file <filename>", async (id, filename) => {
  const entry = await getEntry(id)
  const file = entry.files.find(file => file.filename == pathToPlatformPath(filename))
  assert(!!file, `Could not find filename ${filename} of entry ${id}`)
})

step("Database has <amount> groups", async (amount) => {
  const data = await readDatabase()
  const groupIds = data.data
    .filter(entry => entry.groupIds && entry.groupIds.length)
    .reduce((groupIds, entry) => {
      entry.groupIds.forEach(groupId => !groupIds.includes(groupId) && groupIds.push(groupId))
      return groupIds
    }, [])

  assert(groupIds.length == amount, `Expecting ${amount} groups but have ${groupIds.length} groups`)
})

const getGroupEntries = async (id) => {
  const data = await readDatabase()
  return data.data.filter(entry => entry.id.startsWith(id) || (entry.groupIds && entry.groupIds.find(groupId => groupId.includes(id))))
}

step("Database group <id> has <amount> entries", async (id, amount) => {
  const entries = await getGroupEntries(id)
  assert(entries.length == amount, `Expecting ${amount} entries of groups ${id} but have ${entries.length} entries`)
})

step("Database group <id> has file <filename>", async (id, filename) => {
  const entries = await getGroupEntries(id)

  const groupFiles = entries.reduce((result, entry) => result.concat(entry.files), [])
  const found = groupFiles.find(file => file.filename == pathToPlatformPath(filename))
  assert(!!found, `Could not find filename ${filename} of group ${id}`)
})

const getDatabaseStat = async () => stat(getDatabaseFilename()).catch(err => ({errCode: err.code}))

step("Save database file stat", async () => {
  const fileStat = await getDatabaseStat()
  gauge.dataStore.scenarioStore.put('databaseFileStat', fileStat)
})

const assertObjectValues = (a, b, keyBlacklist) => {
  Object.keys(a)
    .filter(key => (keyBlacklist || []).indexOf(key) < 0)
    .forEach(key => assert(JSON.stringify(a[key]) == JSON.stringify(b[key]), `Expected ${key} to be ${JSON.stringify(a[key])} but was ${JSON.stringify(b[key])}`))
}

step("Database file stat are unchanged", async () => {
  const fileStat = await getDatabaseStat()
  const prevFileStat = gauge.dataStore.scenarioStore.get('databaseFileStat')
  assertObjectValues(prevFileStat, fileStat, ['atime', 'atimeMs'])
})

step("Wait for database file stat change", async () => {
  const prevFileStat = gauge.dataStore.scenarioStore.get('databaseFileStat')

  const hasStatChanges = async (props) => {
    const fileStat = await getDatabaseStat()
    const change = props.findIndex(prop => fileStat[prop] && fileStat[prop] != prevFileStat[prop])
    return change >= 0
  }

  const test = () => hasStatChanges(['size', 'mtimeMs'])
    .then(changed => changed || Promise.reject(new Error('Unchanged')))

  return waitFor(test, 15 * 1000)
})

step("Remove database entries by query <query>", async (query) => {
  return runCli(['database', 'remove', '-d', getDatabaseFilename(), '-e', getEventsFilename(), '-q', query]);
})

step("Remove database entries with args <args> by query <query>", async (args, query) => {
  const argList = args.split(/\s+/)
  return runCli(['database', 'remove', '-d', getDatabaseFilename(), '-e', getEventsFilename(), '-q', query, ...argList]);
})

step("Remove database entries without events by query <query>", async (query) => {
  return runCli(['database', 'remove', '-d', getDatabaseFilename(), '-q', query]);
})

step("Remove database entries with config by query <query>", async (query) => {
  return runCli(['database', 'remove', '-q', query]);
})
