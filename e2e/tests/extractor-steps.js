/* globals gauge*/
const assert = require("assert");

const { getIndexFilename, getStorageDir, runCli } = require('../utils');

step("Extract files", async () => {
  const code = await runCli(['extract', '-i', getIndexFilename(), '-s', getStorageDir()]);
  const command = gauge.dataStore.scenarioStore.get('lastCommand')
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})

step("Extract files with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return runCli(['extract', '-i', getIndexFilename(), '-s', getStorageDir(), ...argList]);
})
