const { readFileSync }  = require('fs')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

const hashFile = (file, hash = 'md5', len = 8) => {
  const data = readFileSync(file, 'utf-8')
  return crypto.createHash(hash).update(data).digest('hex').substring(0, len)
}

const replaceFile = async (file, pattern, replacer) => {
  const data = await fs.readFile(file, 'utf-8')
  const replaced = data.replace(pattern, replacer)
  if (data != replaced) {
    await fs.writeFile(file, replaced, 'utf-8')
  }
}

const renameFile = async (file, newFile) => fs.access(file).then(() => fs.rename(file, newFile), () => true)

const run = async () => {
  const baseDir = 'dist'
  const renames = {}

  const hashReplacer = (file, name, ext) => {
    const hash = hashFile(path.join(baseDir, file))
    const hashedFile = `${name}${hash}.${ext}`
    renames[file] = hashedFile
    return hashedFile
  }

  await replaceFile('dist/index.html', /([-A-Za-z\.\/]+\.)(js|css)/g, hashReplacer)
  await replaceFile('dist/app.css', /([-A-Za-z0-9\.\/]+\.)(ttf|woff2)/g, hashReplacer)

  await Promise.all(Object.entries(renames).map(async ([file, hashedFile]) => {
    const mapFile = `${file}.map`
    const hasMapFile = await fs.access(path.join(baseDir, mapFile)).then(() => true, () => false)
    if (hasMapFile) {
      await replaceFile(path.join(baseDir, file), mapFile, `${hashedFile}.map`)
      await renameFile(path.join(baseDir, mapFile), path.join(baseDir, `${hashedFile}.map`))
    }
    await renameFile(path.join(baseDir, file), path.join(baseDir, hashedFile))
  }))
}

run().then(() => true, err => console.log(`Error ${err}`, err))