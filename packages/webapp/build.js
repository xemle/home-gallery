const esbuild = require('esbuild');
const args = process.argv.splice(2)
const watch = args.indexOf('--watch') >= 0

const targets = [
  {
    entryPoints: ['./src/App.ts'],
    bundle: true,
    minify: !watch,
    sourcemap: true,
    platform: 'browser',
    target: 'es2015',
    outdir: 'dist',
    watch: watch
  }
]

Promise.all(targets.map(target => esbuild.build(target))).catch(e => console.error(e))
