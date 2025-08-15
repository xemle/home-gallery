#!/usr/bin/env node

import esbuild from 'esbuild'
import { glob } from 'glob'

const args = process.argv.splice(2)
const command = args.shift()

if (command == 'build') {
  build(args).catch(handleError)
}

async function build(args) {
  const watch = args.indexOf('--watch') >= 0

  const files = await glob('./src/**/*.{ts,js}', {
    ignore: {
      ignored: p => p.name.match(/test/) || p.name.match(/\.ne$/)
    }
  })

  const buildOptions ={
    entryPoints: files,
    sourcemap: true,
    platform: 'node',
    target: 'es2022',
    format: 'esm',
    outdir: 'dist'
  }

  if (watch) {
    let ctx = await esbuild.context(buildOptions)
    return ctx.watch()
  }

  return esbuild.build(buildOptions)
    .catch(cause => { throw new Error(`Build failed: ${cause}`, {cause}) })
}

function handleError(err) {
  console.log(`dev failed: ${err}`);
  process.exit(1)
}