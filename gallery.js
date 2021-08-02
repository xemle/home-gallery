#!/usr/bin/env node

const logger = require('@home-gallery/logger')
logger() // Initiate root logger

const cli = require('@home-gallery/cli');

if (require.main === module) {
  cli();
}
