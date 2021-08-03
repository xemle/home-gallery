const fs = require('fs/promises')
const path = require('path')
const bundler = require('@home-gallery/bundle')

const readPackage = async (baseDir) => {
  const pkg = await fs.readFile(path.join(baseDir, 'package.json'), 'utf8')
  return JSON.parse(pkg);
}

const parseArgReducer = (options, arg) => {
  if (arg.length <= 2 || !arg.startsWith('--')) {
    return options;
  }
  let [name, value] = arg.substr(2).split('=')
  name = name.replace(/-./g, m => m.substr(1, 1).toUpperCase())
  options[name] = typeof value != 'undefined' ? value : true
  return options;
}

const parseOptions = async () => {
  const pkg = await readPackage(path.dirname(__dirname))
  const args = process.argv.slice(2)
  return args.reduce(parseArgReducer, {
    bundleFile: 'bundle.yml',
    version: pkg.version || '1.0.0'
  });
}

parseOptions()
  .then(bundler.bundle)
  .then(() => console.log(`Bundling done`))
  .catch(e => console.error(`Bundling failed!`, e))
