/* globals gauge*/
const assert = require("assert");

const { getIndexFilename, getStorageDir, runCli } = require('../utils');

const addCliArg = (args, storeProp, cliOption) => {
  const value = gauge.dataStore.scenarioStore.get(storeProp)
  if (value && !args.includes(cliOption)) {
    args.push(cliOption, value)
  }
}

const extract = async (args) => {
  addCliArg(args, 'apiServerUrl', '--api-server')
  addCliArg(args, 'geoServerUrl', '--geo-server')
  return runCli(args);
}

step("Extract files", async () => {
  const {code} = await extract(['extract', '-i', getIndexFilename(), '-s', getStorageDir()])
  const command = gauge.dataStore.scenarioStore.get('lastCommand')
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})

step("Extract files with args <args>", async (args) => {
  const argList = args.split(/\s+/)
  return extract(['extract', '-i', getIndexFilename(), '-s', getStorageDir(), ...argList]);
})
