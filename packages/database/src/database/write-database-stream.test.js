import t from 'tap'
import path from 'path'
import { unlink, access } from 'fs/promises'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

import { through } from '@home-gallery/stream'
import { GalleryFileType } from '@home-gallery/common'

import { createReadableStream } from './read-database-stream.js'
import { createWriteStream, createStringifyEntry } from './write-database-stream.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const testDir = path.resolve(__dirname, '..', '..', 'test')

t.only('createWriteStream', async t => {
  t.test('basic', async t => {
    const filename = path.resolve(testDir, 'database.db')
    const readable = await createReadableStream(filename)

    const tmpFilename = path.resolve(tmpdir(), `database-${new Date().getTime()}.db`)
    const writeStream = await createWriteStream(tmpFilename)


    await pipeline(
      readable,
      writeStream,
    )


    const exists = await access(tmpFilename).then(() => true, () => false)
    t.same(exists, true)
    await unlink(tmpFilename)
  })
})

t.test('createStringifyEntry', async t => {
  const databaseFileType = new GalleryFileType("home-gallery/database@1.3")

  t.test('basic', async t => {
    const entries = [
      {id: 'abc'},
      {id: '123'},
    ]


    let data = ''
    await pipeline(
      Readable.from(entries),
      createStringifyEntry(databaseFileType, new Date('2024-07-13T22:24:36Z')),
      through(function(json, enc, cb) {
        data += json
        cb()
      })
    )


    t.same(data, '{"type":"home-gallery/database@1.3","created":"2024-07-13T22:24:36.000Z","data":[{"id":"abc"},{"id":"123"}]}')
  })

  t.test('empty entries', async t => {
    const entries = []


    let data = ''
    await pipeline(
      Readable.from(entries),
      createStringifyEntry(databaseFileType, new Date('2024-07-13T22:24:36Z')),
      through(function(json, enc, cb) {
        data += json
        cb()
      })
    )


    t.same(data, '{"type":"home-gallery/database@1.3","created":"2024-07-13T22:24:36.000Z","data":[]}')
  })
})
