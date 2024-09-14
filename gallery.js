#!/usr/bin/env node

import { readFile } from 'fs/promises'
import path from 'path'
import url from 'url'

const readBuildInfo = async () => {
  const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
  const buildFile = path.resolve(__dirname, '.build.json')
  return readFile(buildFile, 'utf8').then(data => JSON.parse(data))
}

const run = async () => {
  const { Logger } = await import('@home-gallery/logger')
  Logger() // Initiate root logger
  const { cli } = await import('@home-gallery/cli')
  const buildInfo = await readBuildInfo().catch(() => ({}))
  return cli(buildInfo.version || '1.0.0')
}

const isMain = () => {
  if (process.argv.length < 2) {
    return false
  }
  const script = process.argv[1]
  const normalizedScript = script.endsWith('.js') ? script : script + '.js'
  const scriptUrl = url.pathToFileURL(normalizedScript)
  return import.meta.url.endsWith(scriptUrl.href)
}

if (isMain()) {
  run()
}

export default run;
