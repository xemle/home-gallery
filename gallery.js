#!/usr/bin/env node

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
  return import.meta.url.endsWith(normalizedScript)
}

if (isMain()) {
  run()
}

export default run;
