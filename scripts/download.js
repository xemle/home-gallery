import fs from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { createGunzip } from 'zlib'
import tar from 'tar-fs'
import zip from 'extract-zip'

export const exists = async file => fs.access(file).then(() => true).catch(() => false)

export const downloadFile = async (url, file) => {
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

export const extractTarGz = async (file, dir, ignore) => {
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

export const extractZip = async (file, dir) => {
  return zip(file, {dir})
}

export const extractArchive = async (file, dir) => {
  await fs.mkdir(dir, {recursive: true})

  if (file.match(/\.tar\.gz$/)) {
    return extractTarGz(file, dir)
  } else if (file.match(/\.zip$/)) {
    return extractZip(file, dir)
  } else {
    console.log(`Unsupported archive ${path.basename(file)}`)
  }
}
