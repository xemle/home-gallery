const name = 'home-gallery/database'
const major = 1
const minor = 3

export const isDatabaseTypeCompatible = type => type && type.startsWith(`${name}@${major}.`)

export const HeaderType = `${name}@${major}.${minor}`

export const getMajorMinor = type => {
  if (!type.startsWith(`${name}@`)) {
    throw new Error(`Invalid type. Expecting ${name}@... but was ${type}`)
  }
  return type.substring(name.length + 1).split('.').map(v => +v)
}
