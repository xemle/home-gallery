import path from 'path'
import esbuild from 'esbuild'
import { glob } from 'glob'

export async function build(args) {
  const watch = args.indexOf('--watch') >= 0

  const files = await glob('./src/**/*.{ts,js}', {
    ignore: {
      ignored: p => !!(p.name.match(/test/) || p.name.match(/\.ne$/))
    }
  })

  /** @type {import('esbuild').BuildOptions} */
  const buildOptions ={
    entryPoints: files,
    sourcemap: true,
    platform: 'node',
    target: 'es2022',
    format: 'esm',
    outdir: 'dist',
    plugins: [],
  }

  if (watch) {
    const name = path.basename(process.cwd())
    buildOptions.plugins.push(watchLoggerPlugin(name))
    let ctx = await esbuild.context(buildOptions)
    return ctx.watch()
      .then(() => new Promise(() => {}))
  }

  return esbuild.build(buildOptions)
    .catch(cause => { throw new Error(`Build failed: ${cause}`, {cause}) })
}

function watchLoggerPlugin(name) {
  return {
    name: 'watch-logger',
    setup(build) {
      build.onEnd(result => {
        const time = new Date().toLocaleTimeString()
        if (result.errors.length > 0) {
          console.error(`${time} [${name}] ❌ Build failed on change! ${result.errors.join('\n')}`);
        } else {
          console.log(`${time} [${name}] ✅ esbuild rebuilt successfully`);
        }
      })
    },
  }
}