import esbuild from 'esbuild'
import glob from 'glob'

const args = process.argv.splice(2)
const watch = args.indexOf('--watch') >= 0

glob('./src/**/!(*.test.ts)', (_, files) => {
  const targets = [
    {
      entryPoints: files,
      sourcemap: true,
      platform: 'node',
      target: 'es2020',
      format: 'esm',
      outdir: 'dist',
      watch: watch
    }
  ]

  const catchError = e => {
    console.error(`Build faild due ${e}`, e)
    process.exit(1)
  }

  Promise.all(targets.map(target => esbuild.build(target))).catch(catchError)
})
