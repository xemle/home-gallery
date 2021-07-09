const { stat } = require('fs/promises')
const assert = require("assert");
const { getIndexFilename, getStorageDir, getDatabaseFilename, runCli, readDatabase } = require('../utils');

step("Create database", async () => {
  const code = await runCli(['database', '-i', getIndexFilename(), '-s', getStorageDir(), '-d', getDatabaseFilename()]);
  const command = gauge.dataStore.scenarioStore.get('lastCommand')
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})

step("Create database with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return runCli(['database', '-i', getIndexFilename(), '-s', getStorageDir(), '-d', getDatabaseFilename(), ...argList]);
})

step("Database has <amount> entries", async (amount) => {
  const data = await readDatabase()
  assert(data.data.length == amount, `Expecting ${amount} entries but have ${data.data.length} entries`)
})

const getEntry = async id => {
  const data = await readDatabase()
  const entry = data.data.find(entry => entry.id.startsWith(id))
  assert(!!entry, `Could not find entry with id ${id}`)
  return entry
}

step("Database entry <id> has property <property> with value <value>", async (id, property, value) => {
  const entry = await getEntry(id)
  assert(entry[property] == value, `Expected property ${property} of entry ${id} to be ${value} but it is ${entry[property]}`)
})

step("Database entry <id> has <amoung> files", async (id, amount) => {
  const entry = await getEntry(id)
  assert(entry.files.length == amount, `Expected ${amount} files but has ${entry.files.length}`)
})

step("Database entry <id> has file <filename>", async (id, filename) => {
  const entry = await getEntry(id)
  const file = entry.files.find(entry => entry.filename == filename)
  assert(!!file, `Could not find filename ${filename} of entry ${id}`)
})

const getDatabaseStat = async () => stat(getDatabaseFilename())

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
