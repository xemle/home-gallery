import esbuild from 'esbuild'
import { glob } from 'glob'

const args = process.argv.splice(2)
const watch = args.indexOf('--watch') >= 0

const build = async () => {
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
    }
  ]

  return Promise.all(
    targets.map(target => watch ? esbuild.context(target).then(ctx => ctx.watch()) : esbuild.build(target))
  )
}

build()
  .catch(err => {
    console.error(`Build failed due ${err}`, err)
    process.exit(1)
  })
