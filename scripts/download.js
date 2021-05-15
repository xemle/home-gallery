const fs = require('fs').promises
const { createWriteStream, createReadStream } = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const { createGunzip } = require('zlib')
const tar = require('tar-fs')
const zip = require('extract-zip')

const exists = async file => fs.access(file).then(() => true).catch(() => false)

const downloadFile = async (url, file) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const res = await fetch(url)

  const output = createWriteStream(file)
  await new Promise((resolve, reject) => {
    res.body
      .pipe(output)
      .on('finish', resolve)
      .on('error', reject)
  })
}

const extractTarGz = async (file, dir, ignore) => {
  const allowAll = () => false
  return new Promise((resolve, reject) => {
    createReadStream(file)
      .pipe(createGunzip())
      .pipe(tar.extract(dir, {
        ignore: ignore || allowAll
      }))
      .on('finish', resolve)
      .on('error', reject)
  })
}

const extractZip = async (file, dir) => {
  return zip(file, {dir})
}

const extractArchive = async (file, dir) => {
  await fs.mkdir(dir, {recursive: true})

  if (file.match(/\.tar\.gz$/)) {
    return extractTarGz(file, dir)
  } else if (file.match(/\.zip$/)) {
    return extractZip(file, dir)
  } else {
    console.log(`Unsupported archive ${path.basename(file)}`)
  }
}

module.exports = {
  exists,
  extractArchive,
  extractTarGz,
  downloadFile
}