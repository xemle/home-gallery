import fs from 'fs/promises'
import path from 'path'
import YAML from 'yaml'

import { expandConfigDefaults } from './expand-defaults.js'
import { resolveConfig } from './resolve-config.js'

export const readConfig = async (configFile, env) => {
  const isYaml = configFile.match(/\.ya?ml$/i);
  const isJson = configFile.match(/\.json$/i);
  if (!isYaml && !isJson) {
    throw new Error(`Unknown file extension of '${configFile}'. Expect a .yaml or .json file`)
  }

  const raw = await fs.access(configFile)
    .catch(() => Promise.reject(new Error(`Configuration file ${configFile} does not exist`)))
    .then(() => fs.readFile(configFile, 'utf8'))
  return readData(raw, isYaml, path.dirname(configFile), env)
}

export const readData = (raw, isYaml, baseDir, env) => {
  const config = parseConfig(raw, isYaml)

  expandConfigDefaults(config, env)
  resolveConfig(config, baseDir, env)

  return config
}

export const parseConfig = (raw, isYaml) => isYaml ? YAML.parse(raw) : JSON.parse(raw)
