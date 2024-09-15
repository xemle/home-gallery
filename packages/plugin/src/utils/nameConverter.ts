export const toSanitizeName = (name: string) => name.replaceAll(/[^A-Za-z0-9]+/g, '-').replaceAll(/(^-+|-+$)/g, '')

export const toDashName = (name: string) => {
  const sanitizedName = toSanitizeName(name)
  return sanitizedName.replaceAll(/[A-Z]+/g, (char: string, pos: number) => `${pos == 0 ? '' : '-'}${char.toLowerCase()}`).replaceAll(/-+/g, '-')
}

export const toCamelName = (name: string) => {
  const dashName = toDashName(name)
  return dashName.replaceAll(/-[a-z]+/g, (char: string) => char.substring(1, 2).toUpperCase() + char.substring(2))
}

export const toClassName = (name: string) => {
  const camelName = toCamelName(name)
  return camelName.charAt(0).toUpperCase() + camelName.slice(1)
}
