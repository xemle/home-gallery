import path from 'path'
import fs, { access, mkdir, unlink, rename, rm } from 'fs/promises'
import { pipeline } from 'stream/promises'
import { createGunzip, createGzip } from 'zlib'
import { Readable, Writable } from "stream";

import Logger from "@home-gallery/logger";
import { createTmpFile, createRandomString } from "@home-gallery/common";
import { parseJson, write } from "@home-gallery/stream";
import { TLocalStorageFile, TLocalStorageDir, TStorage, TStorageEntry } from "@home-gallery/types";

const log = Logger('plugin.storage')

export class Storage implements TStorage {
  #dir: string

  constructor(dir: string) {
    this.#dir = dir
  }

  #parse(entry: TStorageEntry, suffix: string) {
    const name = `${entry.sha1sum.substring(4)}-${suffix}`
    const dir = path.join(entry.sha1sum.substring(0, 2), entry.sha1sum.substring(2, 4))
    return {
      file: path.join(dir, name),
      dir,
      name,
    }
  }

  #getMetaKey(suffix: string) {
    return suffix.toLowerCase()
      .replaceAll(/\.json(\.gz)?$/g, '')
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  }

  hasFile(entry: TStorageEntry, suffix: string): boolean {
    const { file } = this.#parse(entry, suffix)
    return entry.files.includes(file)
  }

  async #createReadStream(entry: TStorageEntry, suffix: string): Promise<Readable> {
    const { file } = this.#parse(entry, suffix)
    const fd = await fs.open(path.resolve(this.#dir, file))
    const read = fd.createReadStream()
    read.on('end', () => {
      if (!entry.files.includes(file)) {
        entry.files.push(file)
      }
    })
    return read
  }

  async #readJson(entry: TStorageEntry, suffix: string) {
    const metaKey = this.#getMetaKey(suffix)
    if (entry.meta[metaKey]) {
      return entry.meta[metaKey]
    }

    let data
    const isCompressed = suffix.endsWith('.gz')
    const read = await this.#createReadStream(entry, suffix)
    const streams = [read]
    if (isCompressed) {
      streams.push(createGunzip())
    }
    streams.push(parseJson())
    streams.push(write((chunk: any) => data = chunk))
    await pipeline(streams)
    entry.meta[metaKey] = data
    return data
  }

  async readFile(entry: TStorageEntry, suffix: string): Promise<any> {
    const normalizedSuffix = suffix.toLowerCase()
    const isJson = normalizedSuffix.endsWith('.json') || normalizedSuffix.endsWith('.json.gz')

    if (isJson) {
      return this.#readJson(entry, normalizedSuffix)
    } else {
      const { file } = this.#parse(entry, suffix)
      const buf = fs.readFile(path.resolve(this.#dir, file))
      if (!entry.files.includes(file)) {
        entry.files.push(file)
      }
      return buf
    }
  }

  async #createWriteStream(entry: TStorageEntry, suffix: string): Promise<Writable> {
    const { file, dir } = this.#parse(entry, suffix)
    await fs.mkdir(path.resolve(this.#dir, dir), {recursive: true})

    const fd = await fs.open(path.resolve(this.#dir, file), 'w')
    const write = fd.createWriteStream()
    write.on('close', () => {
      entry.files.push(file)
    })
    return write
  }

  async #writeJson(entry: TStorageEntry, suffix: string, data: any) {
    const isCompressed = suffix.endsWith('.gz')

    const write = await this.#createWriteStream(entry, suffix)
    const stringify = JSON.stringify(data)
    const streams: any[] = [
      Readable.from(Buffer.from(stringify))
    ]
    if (isCompressed) {
      streams.push(createGzip())
    }
    streams.push(write)
    await pipeline(streams)
    const metaKey = this.#getMetaKey(suffix)
    entry.meta[metaKey] = data
  }

  async writeFile(entry: TStorageEntry, suffix: string, data: any): Promise<void> {
    const normalizedSuffix = suffix.toLowerCase()
    const isJson = normalizedSuffix.endsWith('.json') || normalizedSuffix.endsWith('.json.gz')

    if (isJson) {
      return this.#writeJson(entry, normalizedSuffix, data)
    } else {
      const { file, dir } = this.#parse(entry, suffix)
      await fs.mkdir(path.resolve(this.#dir, dir), {recursive: true})
      await fs.writeFile(path.resolve(this.#dir, file), data)
      entry.files.push(file)
    }
  }

  async copyFile(entry: TStorageEntry, suffix: string, file: any): Promise<void> {
    const { file: entryFile } = this.#parse(entry, suffix)
    const storageFile = path.resolve(this.#dir, entryFile)
    await fs.mkdir(path.dirname(storageFile), {recursive: true})
    await fs.copyFile(file, storageFile)
    await this.readFile(entry, suffix)
  }

  async symlink(entry: TStorageEntry, suffix: string, file: string): Promise<any> {
    const { file: entryFile } = this.#parse(entry, suffix)
    const storageFile = path.resolve(this.#dir, entryFile)
    await fs.mkdir(path.dirname(storageFile), {recursive: true})
    await fs.symlink(file, storageFile)
    await this.readFile(entry, suffix)
  }

  async removeFile(entry: TStorageEntry, suffix: string): Promise<any> {
    const { file } = this.#parse(entry, suffix)
    const storageFile = path.resolve(this.#dir, file)
    return fs.access(storageFile)
      .then(() => fs.unlink(storageFile), () => false)
      .then(() => {
        const metaKey = this.#getMetaKey(suffix)
        if (entry.meta[metaKey]) {
          delete entry.meta[metaKey]
        }
        const pos = entry.files.indexOf(file)
        if (pos >= 0) {
          entry.files.splice(pos, 1)
        }
      })
  }

  async createLocalFile(entry: TStorageEntry, suffix: string): Promise<TLocalStorageFile> {
    const { file } = this.#parse(entry, suffix)
    if (this.hasFile(entry, suffix)) {
      const storageFile = path.resolve(this.#dir, file)
      return new LocalStorageFile(this, entry, suffix, this.#dir, file, storageFile, false)
    }

    await access(this.#dir).then(() => true, () => mkdir(this.#dir, {recursive: true}))
    const suffixExtension = suffix.substring(suffix.lastIndexOf('.'))
    const tmpFile = await createTmpFile(path.resolve(this.#dir, entry.sha1sum.substring(0, 7)), suffixExtension, 'entry-')

    return new LocalStorageFile(this, entry, suffix, this.#dir, file, tmpFile, true)
  }

  async createLocalDir() : Promise<LocalStorageDir> {
    const dir = path.resolve(this.#dir, `.localTmpDir-${createRandomString()}.tmp`)
    const exists = await access(dir).then(() => true, () => false)
    if (exists) {
      return this.createLocalDir()
    }

    await mkdir(dir, {recursive: true})
    return new LocalStorageDir(dir)
  }
}

class LocalStorageFile implements TLocalStorageFile {
  #storage: TStorage
  #entry: TStorageEntry
  #suffix: string
  #storageDir: string
  #storageFile: string

  #isTmpFile: boolean
  file: string

  constructor(storage: TStorage, entry: TStorageEntry, suffix: string, storageDir: string, storageFile: string, file: string, isTmpFile: boolean) {
    this.#storage = storage
    this.#entry = entry
    this.#suffix = suffix
    this.#storageDir = storageDir
    this.#storageFile = storageFile

    this.#isTmpFile = isTmpFile
    this.file = file
  }

  async commit() {
    if (this.#isTmpFile) {
      const targetFile = path.join(this.#storageDir, this.#storageFile)
      const dir = path.dirname(targetFile)

      await access(dir).then(() => true, () => mkdir(dir, {recursive: true}))
      await rename(this.file, targetFile)
    }

    const isJson = this.#suffix.match(/\.json(\.gz)?$/)
    if (isJson) {
      // read file to populate files and meta
      return this.#storage.readFile(this.#entry, this.#suffix)
    } else if (!this.#entry.files.includes(this.#storageFile)) {
      this.#entry.files.push(this.#storageFile)
    }
  }

  async release() {
    if (this.#isTmpFile) {
      await access(this.file).then(() => unlink(this.file), () => true)
    }
  }
}

class LocalStorageDir implements TLocalStorageDir {
  dir: string

  constructor(dir: string) {
    this.dir = dir
  }

  async release() {
    await access(this.dir).then(() => rm(this.dir, {recursive: true}), () => true)
  };
}