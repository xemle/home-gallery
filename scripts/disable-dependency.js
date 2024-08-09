import fs from 'fs/promises'
import path from 'path'

const args = process.argv.slice(2)

const [options, names] = args.reduce(([options, names], value) => {
  const match = value.match(/^--?([^=]+)(=(.+))?$/)
  if (match) {
    options[match[1]] = match[3] || true
  } else {
    names.push(...value.split(','))
  }
  return [options, names]
}, [{prefix: '.'}, []])

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

run(path.join(options.prefix, 'package.json'), names)
  .then(disabled => console.log(disabled.length ? `Disabled dependencies ${disabled.join(', ')} in ${options.prefix}` : `No match found for args: ${args.join(' ')}`))
  .catch(console.log)
