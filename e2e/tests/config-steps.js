/* globals gauge*/
"use strict"
const { getFilesDir, getConfigFilename, runCli, setConfigValue, getConfigValue } = require('../utils')

step("Init config", async () => {
  await runCli(['run', 'init', '--config', getConfigFilename(), '--source', getFilesDir()])
})

step("Set config <key> to <value>", async (key, jsonValue) => {
  let value
  try {
    value = JSON.parse(jsonValue)
  } catch (e) {
    value = `${jsonValue}`
  }
  return setConfigValue(key, value)
})