import esbuild from 'esbuild'
import { glob } from 'glob'

const args = process.argv.splice(2)
const watch = args.indexOf('--watch') >= 0

async function build() {
  const files = await glob('./src/**/*.ts', {
    ignore: {
      ignored: p => p.name.match(/test/)
    }
  })

  const targets = [
    {
      entryPoints: files,
      sourcemap: true,
      platform: 'node',
      target: 'es2022',
      format: 'esm',
      outdir: 'dist',
      watch: watch
    }
  ]

  return Promise.all(targets.map(target => esbuild.build(target)))
}

build().catch(err => {
  console.log(`Build failed: ${err}`)
  process.exit(1)
})