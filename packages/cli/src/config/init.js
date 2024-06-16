import fs from 'fs/promises'
import path from 'path'

import Logger from '@home-gallery/logger'

const log = Logger('cli.config.init')

const replace = (lines, pattern, replaceBy, deleteLines = 1) => {
  const index = lines.findIndex(line => line.match(pattern))
  const items = Array.isArray(replaceBy) ? replaceBy : [replaceBy]
  if (index) {
    lines.splice(index, deleteLines, ...items)
    return true
  }
  return false
}

export const setData = (data, sources) => {
  if (!sources || !sources.length) {
    throw new Error(`No sources are given. Please provide source directories`)
  }

  const lines = data.split('\n')

  if (replace(lines, /^sources:$/, ['sources:', ...sources.map(source => `  - dir: '${source}'`)], 2)) {
    log.debug(`Set sources directories: ${sources.map(s => `'${s}'`).join(', ')}`)
  } else {
    throw new Error(`Source marker could not be found. Check base configuration for initialization`)
  }

  return lines.join('\n')
}

export const initConfig = async (configFile, sourceConfigFile, sources) => {
  if (!configFile.match(/\.ya?ml$/i)) {
    throw new Error(`Unsupported file extension for configuration initialization. Expecting a .yaml or .yml file: ${configFile}`)
  }

  const data = await fs.readFile(sourceConfigFile, 'utf-8')
    .catch(cause => {
      const message = `Failed to read source configuration file '${sourceConfigFile}' for initialization`
      const error = new Error(message)
      error.cause = cause
      throw error
    })

  return fs.mkdir(path.dirname(configFile), { recursive: true })
    .then(() => setData(data, sources))
    .then(data => fs.writeFile(configFile, data, 'utf8').then(() => data))
    .then(data => {
      log.info(`Initialized configuration '${configFile}' from ${sourceConfigFile}`)
      return data
    })
}
