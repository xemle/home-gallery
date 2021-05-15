import fs from 'fs/promises'
import path from 'path'

export const symlink = async (file: string, link: string) => {
  await fs.mkdir(path.dirname(link), {recursive: true})
  await fs.access(link).then(() => fs.unlink(link)).catch(() => true)
  const relativeFile = path.relative(path.dirname(link), file)
  return fs.symlink(relativeFile, link)
}