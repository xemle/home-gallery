#!/usr/bin/env node

const run = async () => {
  const { Logger } = await import('@home-gallery/logger')
  Logger() // Initiate root logger
  const { cli } = await import('@home-gallery/cli')
  cli()
}

if (require.main === module) {
  run()
}
