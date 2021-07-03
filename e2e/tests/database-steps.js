const path = require('path')
const assert = require("assert");
const { cp, mkdir } = require('shelljs')
const { getTestDataDir, getIndexFilename, getStorageDir, getDatabaseFilename, runCli, readDatabase } = require('../utils');

step("Prepare database from <dir>", async (dir) => {
  const baseDir = gauge.dataStore.scenarioStore.get('baseDir');
  mkdir('-p', path.dirname(baseDir))
  cp('-r', path.resolve(getTestDataDir(), dir), baseDir)
})

step("Create database", async () => {
  const code = await runCli(['database', '-i', getIndexFilename(), '-s', getStorageDir(), '-d', getDatabaseFilename()]);
  const command = gauge.dataStore.scenarioStore.get('lastCommand')
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})

step("Database has <amount> entries", async (amount) => {
  const data = await readDatabase()
  assert(data.data.length == amount, `Expecting ${amount} entries but have ${data.data.length} entries`)
})

step("Database entry <id> has property <property> with value <value>", async (id, property, value) => {
  const data = await readDatabase()
  const entry = data.data.find(entry => entry.id.startsWith(id))
  assert(!!entry, `Could not find entry with id ${id}`)

  assert(entry[property] == value, `Expected property ${property} of entry ${id} to be ${value} but it is ${entry[property]}`)
})