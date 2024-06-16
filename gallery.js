#!/usr/bin/env node

const logger = require('@home-gallery/logger')
logger() // Initiate root logger

if (require.main === module) {
  import('@home-gallery/cli')
    .then(({ cli })=> cli())
}
