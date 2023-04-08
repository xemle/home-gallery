const fs = require('fs/promises')
const path = require('path')
const bundler = require('@home-gallery/bundle')

const printHelp = () => {
  console.log(`${process.argv[1]} <options>

--help
    Print this help
--no-before
    Skip before actions for general preparation
--no-run
    Skip run platform specific run actions
--version=<version>
    Overwrite version. Default is version from package.json
--snapshot=<prefix>
    Set snapshot prefix
--bundle-file=<file>
    Set bundle file. Default is bundle.yml
--host-platform=<platform>
    Set platform. Default use given platform in bundle file
--host-arch=<arch>
    Set architecture. Default use given architectures in bundle file
--filter=<filter,...>
    Set platform-arch filter. Eg. linux-x64,win-x64. Default empty
`)
}
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
  const config = args.reduce(parseArgReducer, {
    bundleFile: 'bundle.yml',
    version: pkg.version || '1.0.0'
  });
  if (config.help) {
    printHelp()
    process.exit(0)
  }
  return config
}

parseOptions()
  .then(bundler.bundle)
  .then(() => console.log(`Bundling done`))
  .catch(e => console.error(`Bundling failed!`, e))
