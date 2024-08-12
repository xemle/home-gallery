import t from 'tap'
import fs, { writeFile, access } from 'fs/promises'
import path from 'path'
import os from 'os'
import { gunzip, gzip } from 'zlib'
import { promisify } from 'util'

import { TStorage, TStorageEntry } from "@home-gallery/types";

import { Storage } from './storage.js'

const asyncGunzip = promisify(gunzip)
const asyncGzip = promisify(gzip)

t.only('Storage', async t => {
  let dir: string
  let storage: TStorage

  t.beforeEach(async t => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'storage-'))
    storage = new Storage(dir)
  })

  t.afterEach(async t => {
    await fs.rm(dir, {recursive: true, force: true})
  })

  t.test('writeFile with compressed json', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')

    await storage.writeFile(entry, 'data.json.gz', {a: 42})


    t.same(entry.meta.data.a, 42)
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json.gz'))

    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json.gz')
    t.resolves(fs.access(file))
    const data = await readGzJson(file)
    t.same(data.a, 42)
  })

  t.test('writeFile with json', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    await storage.writeFile(entry, 'acme-data.json', {a: 42})


    t.same(entry.meta.acmeData.a, 42)
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-acme-data.json'))

    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-acme-data.json')
    t.resolves(fs.access(file))
    const data = await readJson(file)
    t.same(data.a, 42)
  })

  t.test('writeFile with binary', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')
    const buf = Buffer.from('2024-06-02T22:14:24+02:00', 'utf8')


    await storage.writeFile(entry, 'file.data', buf)


    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-file.data'))

    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-file.data')
    t.resolves(fs.access(file))
    const data = await fs.readFile(file)
    t.same(data.toString('utf8'), '2024-06-02T22:14:24+02:00')
  })

  t.test('readFile with compressed json', async t => {
    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json.gz')
    await writeGzJson(file, {a: 42})

    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    const data = await storage.readFile(entry, 'data.json.gz')


    t.same(data.a, 42)
    t.same(entry.meta.data.a, 42)
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json.gz'))
  })

  t.test('readFile with json', async t => {
    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json')
    await writeJson(file, {a: 42})

    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    const data = await storage.readFile(entry, 'data.json')


    t.same(data.a, 42)
    t.same(entry.meta.data.a, 42)
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'))
  })

  t.test('readFile with data', async t => {
    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-file.data')
    await fs.mkdir(path.dirname(file), {recursive: true})
    await fs.writeFile(file, '2024-06-02T22:36:59+02:00', 'utf8')

    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    const data = await storage.readFile(entry, 'file.data')


    t.ok(Buffer.isBuffer(data))
    t.same(data.toString('utf8'), '2024-06-02T22:36:59+02:00')
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-file.data'))
  })

  t.test('copyFile', async t => {
    const orig = path.resolve(dir, 'file.data')
    await fs.writeFile(orig, JSON.stringify({a: 42}), 'utf8')

    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    await storage.copyFile(entry, 'data.json', orig)


    t.same(entry.meta.data.a, 42)
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'))

    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json')
    t.resolves(fs.access(file))
    const data = await readJson(file)
    t.same(data.a, 42)
  })

  t.test('symlink', async t => {
    const orig = path.resolve(dir, 'file.data')
    await fs.writeFile(orig, JSON.stringify({a: 42}), 'utf8')

    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    await storage.symlink(entry, 'data.json', orig)
    t.same(entry.meta.data.a, 42)
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'))

    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json')
    t.resolves(fs.access(file))
    const data = await readJson(file)
    t.same(data.a, 42)

    const stat = await fs.lstat(file)
    t.ok(stat.isSymbolicLink(), 'storage file should be a symbolic link')

    const target = await fs.readlink(file)
    t.same(target, orig, 'storage file should symlink to original file.data')
  })

  t.test('removeFile', async t => {
    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json')
    await writeJson(file, {a: 42})
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b', {
      files: ['18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'],
      meta: {
        data: {
          a: 42
        }
      }
    })


    await storage.removeFile(entry, 'data.json')


    t.notOk(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'))
    t.notOk(entry.meta.data)
    t.rejects(fs.access(file))
  })

  t.test('removeFile with non existing file removes files and meta', async t => {
    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json')
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b', {
      files: ['18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'],
      meta: {
        data: {
          a: 42
        }
      }
    })


    await storage.removeFile(entry, 'data.json')


    t.notOk(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-data.json'))
    t.notOk(entry.meta.data)
    t.rejects(fs.access(file))
  })

  t.test('createLocalFile() returns storage file if existis', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')
    await storage.writeFile(entry, 'data.json.gz', {data: 42})


    const localFile = await storage.createLocalFile(entry, 'data.json.gz')


    const file = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-data.json.gz')
    t.same(localFile.file, file)
    t.resolves(localFile.release())
  })

  t.test('createLocalFile binary file with commit', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    const localFile = await storage.createLocalFile(entry, 'heic.png')


    await writeFile(localFile.file, 'data')
    await localFile.commit()


    const target = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-heic.png')
    t.rejects(access(localFile.file))
    t.resolves(access(target))
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-heic.png'))
  })

  t.test('createLocalFile json file with commit', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    const localFile = await storage.createLocalFile(entry, 'acme-plugin.json')


    await writeFile(localFile.file, '{"data":42}')
    await localFile.commit()


    const target = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-acme-plugin.json')
    t.rejects(access(localFile.file))
    t.resolves(access(target))
    t.ok(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-acme-plugin.json'))
    t.same(entry.meta.acmePlugin?.data, 42)
  })

  t.test('createLocalFile file with reject', async t => {
    const entry = createEntry('182926f911d3f9f137596f3d95f78643bfd5246b')


    const localFile = await storage.createLocalFile(entry, 'acme-plugin.json')


    await writeFile(localFile.file, '{"data":42}')
    await localFile.release()


    const target = path.resolve(dir, '18', '29', '26f911d3f9f137596f3d95f78643bfd5246b-acme-plugin.json')
    t.rejects(access(localFile.file))
    t.rejects(access(target))
    t.notOk(entry.files.includes('18/29/26f911d3f9f137596f3d95f78643bfd5246b-acme-plugin.json'))
    t.same(entry.meta, {})
  })

  t.test('createLocalTmpDir() exists', async t => {
    const localDir = await storage.createLocalDir()


    t.resolves(access(localDir.dir))
  })

  t.test('createLocalTmpDir() does not exists after release', async t => {
    const localDir = await storage.createLocalDir()

    await localDir.release()

    t.rejects(access(localDir.dir))
  })
})



function createEntry(sha1sum: string, partial: Partial<TStorageEntry> = {}): TStorageEntry {
  return {
    indexName: 'index',
    filename: 'IMG_1234.jpg',
    type: 'image',
    size: 1024,
    date: '2024-06-03T22:17:47Z',
    sha1sum,
    files: [],
    meta: {},
    sidecars: [],
    ...partial
  }
}
async function readGzJson(file: string) {
  const raw = await fs.readFile(file)
  const json = await asyncGunzip(raw)
  return JSON.parse(json.toString('utf8'))
}

async function readJson(file: string) {
  const raw = await fs.readFile(file)
  return JSON.parse(raw.toString('utf8'))
}

async function writeGzJson(file: string, data: any) {
  await fs.mkdir(path.dirname(file), {recursive: true})
  const raw = await asyncGzip(Buffer.from(JSON.stringify(data)))
  return fs.writeFile(file, raw)
}

async function writeJson(file: string, data: any) {
  await fs.mkdir(path.dirname(file), {recursive: true})
  return fs.writeFile(file, JSON.stringify(data), 'utf8')
}