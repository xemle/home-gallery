/* globals gauge */
"use strict";

const { runCommand, runCli, getPluginBaseDir, getPluginDir, getConfigValue, setConfigValue } = require('../utils');
const { rm } = require('shelljs')

const runNpm = async (args) => {
  return new Promise((resolve, reject) => {
    runCommand('npm', args, {TZ: 'Europe/Berlin'}, (code, stdout, stderr) => {
      return code == 0 ? resolve({code, stdout, stderr}) : reject(new Error(`Return code is non zero: ${code}`))
    })
  })
}

step("Create <type> plugin <name> with modules <modules>", async (type, name, modules) => {
  return runCli(['plugin', 'create', '--dir', getPluginBaseDir(), '--name', name, '--sourceType', type, '--modules', ...modules.split(/\s*,\s*/), '--force']);
})

step("Build plugin <name>", async (name) => {
  await runNpm([`--prefix=${getPluginDir(name)}`, 'install']);
  await runNpm([`--prefix=${getPluginDir(name)}`, 'run', 'build']);
})

step("Add plugin dir to config", async () => {
  const dirs = await getConfigValue('pluginManager.dirs') || []
  dirs.push(getPluginBaseDir())
  return setConfigValue('pluginManager.dirs', dirs)
})

step("Delete plugin <name>", async (name) => {
  rm('-rf', getPluginDir(name))
})

