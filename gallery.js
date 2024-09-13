#!/usr/bin/env node

import url from 'url'

const run = async () => {
  const { Logger } = await import('@home-gallery/logger')
  Logger() // Initiate root logger
  const { cli } = await import('@home-gallery/cli')
  return cli()
}

const isMain = () => {
  if (process.argv.length < 2) {
    return false
  }
  const script = process.argv[1].replaceAll(/\\/g, '/') // ensure posix path
  const normalizedScript = script.endsWith('.js') ? script : script + '.js'
  const scriptUrl = url.pathToFileURL(normalizedScript)
  return import.meta.url.endsWith(scriptUrl.href)
}

if (isMain()) {
  run()
}

export default run;
