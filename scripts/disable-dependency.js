const fs = require('fs/promises')
const path = require('path')

const args = process.argv.slice(2)

const argsToNames = args => args.map(arg => arg.split(',')).reduce((r, v) => r.concat(v), [])

const disableDependencies = (pkg, names) => {
  pkg.disabledDependencies = pkg.disabledDependencies || {}
  return names.map(name => {
    const deps = Object.keys(pkg.dependencies)
    const matches = deps.filter(dep => dep.indexOf(name) >= 0)
    matches.forEach(dep => {
      pkg.disabledDependencies[dep] = pkg.dependencies[dep]
      delete pkg.dependencies[dep]
    })
    return matches
  }).reduce((r, v) => r.concat(v), [])
}

const readJson = async filename => fs.readFile(filename, 'utf8').then(data => JSON.parse(data))

const writeJson = async (filename, json) => fs.writeFile(filename, JSON.stringify(json, null, 2), 'utf8')

const run = async (pkgFilename, names) => {
  const pkg = await readJson(pkgFilename)

  disabled = disableDependencies(pkg, names)

  await fs.rename(pkgFilename, `${pkgFilename}.orig`)
  await writeJson(pkgFilename, pkg)
  return disabled
}

run('package.json', argsToNames(args))
  .then(disabled => console.log(disabled.length ? `Disabled ${disabled.join(', ')} dependencies` : `No match found for args: ${args.join(' ')}`))
  .catch(console.log)
