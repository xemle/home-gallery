/* globals gauge*/
const assert = require("assert");

const { getIndexFilename, getStorageDir, runCli } = require('../utils');

step("Extract files", async () => {
  const code = await runCli(['extract', '-i', getIndexFilename(), '-s', getStorageDir()]);
  const command = gauge.dataStore.scenarioStore.get('lastCommand')
  
  assert(code == 0, `Failed to run ${command} in ${process.env.PWD}. Exit code was ${code}`)
})
