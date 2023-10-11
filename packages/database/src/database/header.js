const name = 'home-gallery/database'
const major = 1
const minor = 3

const isDatabaseTypeCompatible = type => type && type.startsWith(`${name}@${major}.`)

const HeaderType = `${name}@${major}.${minor}`

const getMajorMinor = type => {
  if (!type.startsWith(`${name}@`)) {
    throw new Error(`Invalid type. Expecting ${name}@... but was ${type}`)
  }
  return type.substring(name.length + 1).split('.').map(v => +v)
}

module.exports = {
  isDatabaseTypeCompatible,
  HeaderType,
  getMajorMinor
}