#!/usr/bin/env node

import { build } from '../src/build.js'
import { schema } from '../src/schema/index.js'

const args = process.argv.splice(2)

run(args)
  .then(() => process.exit(0))
  .catch(err => {
    console.log(`dev failed: ${err}`);
    process.exit(1)
  })

async function run(args) {
  const command = args.shift()
  switch (command) {
    case 'build': {
      return build(args)
      break
    }
    case 'schema': {
      return schema(args)
      break
    }
    default:
      throw new Error(`Unknown command: ${command}`)
  }
}

