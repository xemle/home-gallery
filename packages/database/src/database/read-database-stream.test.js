import t from 'tap'
import path from 'path'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

import { through } from '@home-gallery/stream'

import { createReadableStream, createOrEmptyReadableStream, readDatabaseStreamed, createEntrySplitter } from './read-database-stream.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const testDir = path.resolve(__dirname, '..', '..', 'test')

t.only('createReadableStream', async t => {
  t.test('basic', async t => {
    const filename = path.resolve(testDir, 'database.db')


    const readable = await createReadableStream(filename)
    const entries = []
    await pipeline(
      readable,
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 2)
  })

  t.test('reject unknown file', async t => {
    const unknownFile = path.resolve(testDir, 'database-unknown.db')


    t.rejects(createReadableStream(unknownFile))
  })

  t.test('with migration', async t => {
    const filename = path.resolve(testDir, 'database-v1.0.db')


    const readable = await createReadableStream(filename)
    const entries = []
    await pipeline(
      readable,
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 2)
    t.same(entries[0].hash, "99e61930141e8afff0d6d8c52997ec7295d62fd2")
    t.same(entries[1].hash, "d7496b6da889280fc0c175b9b6e3a5326097d023")
  })
})

t.test('createOrEmptyReadableStream', async t => {
  t.test('basic', async t => {
    const unknownFile = path.resolve(testDir, 'database-unknown.db')


    const readable = await createOrEmptyReadableStream(unknownFile)
    const entries = []
    await pipeline(
      readable,
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, ``)
  })
})

t.only('readDatabaseStreamed', async t => {
  t.test('basic', async t => {
    const filename = path.resolve(testDir, 'database-v1.0.db')


    const database = await readDatabaseStreamed(filename)


    t.same(database.type, 'home-gallery/database@1.3.0')
    t.same(database.created, '2024-07-10T20:07:25.084Z')
    t.same(database.data.length, 2)
  })
})

t.test('createEntrySplitter', async t => {
  t.test('empty database', async t => {
    const buffers = [
      Buffer.from('{"type":"home-gallery/database@1.3","created":"2024-07-10T20:07:25.084Z","data":[]}')
    ]
    const entries = []


    await pipeline(
      Readable.from(buffers),
      createEntrySplitter(),
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 0)
  })

  t.test('header event is emitted', async t => {
    const buffers = [
      Buffer.from('{"type":"home-gallery/database@1.3","created":"2024-07-10T20:07:25.084Z","data":[]}')
    ]
    const entries = []


    let header
    await pipeline(
      Readable.from(buffers),
      createEntrySplitter().on('header', data => header = data),
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(header?.type, 'home-gallery/database@1.3')
    t.same(header?.created, '2024-07-10T20:07:25.084Z')
    t.same(header?.data?.length, 0)
  })

  t.test('one entry', async t => {
    let data = '{"type":"home-gallery/database@1.3","created":"2024-07-10T20:07:25.084Z","data":['
    data += '{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","hash":"99e61930141e8afff0d6d8c52997ec7295d62fd2","type":"image","files":[{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","index":"files"}],"previews":["4b/15/7a9dc0e-image-preview-1920.jpg"],"width":4000,"height":3000}'
    data += ']}'
    const buffers = [
      Buffer.from(data)
    ]
    const entries = []


    await pipeline(
      Readable.from(buffers),
      createEntrySplitter(),
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 1)
  })

  t.test('two entries', async t => {
    let data = '{"type":"home-gallery/database@1.3","created":"2024-07-10T20:07:25.084Z","data":['
    data += '{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","hash":"99e61930141e8afff0d6d8c52997ec7295d62fd2","type":"image","files":[{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","index":"files"}],"previews":["4b/15/7a9dc0e-image-preview-1920.jpg"],"width":4000,"height":3000},'
    data += '{"id":"d8b25bd1674e0f4b23695e7518a1e5932dac6ad8","hash":"d7496b6da889280fc0c175b9b6e3a5326097d023","type":"image","files":[{"id":"d8b25bd1674e0f4b23695e7518a1e5932dac6ad8","index":"files"}],"previews":["d8/b2/5bd1674-image-preview-1920.jpg"],"width":4000,"height":3000}'
    data += ']}'
    const buffers = [
      Buffer.from(data)
    ]
    const entries = []


    await pipeline(
      Readable.from(buffers),
      createEntrySplitter(),
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 2)
  })

  t.test('two entries with splitted buffer', async t => {
    const buffers = [
      Buffer.from('{"type":"home-gallery/database@1.3","created":"2024-07-10T2'),
      Buffer.from('0:07:25.084Z","data":[{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0'),
      Buffer.from('d1e5","hash":"99e61930141e8afff0d6d8c52997ec7295d62fd2","type":"i'),
      Buffer.from('mage","files":[{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","index":"files"}],"previews":["4b/15/7a9dc0e-image-prev'),
      Buffer.from('iew-1920.jpg"],"width":4000,"height":3000},{"id":"d8b25bd1674e0f4b23695e7'),
      Buffer.from('518a1e5932dac6ad8","hash":"d7496b6da889280fc0c175b9b6e3a5326097d023","type":"image","files":[{"id":"d8b25bd1674e0f4b236'),
      Buffer.from('95e7518a1e5932dac6ad8","index":"files"}],"previews":["d8/b2/5bd1674-image-preview-1920.jpg"],"width":4000,"height":3000}]}')
    ]
    const entries = []


    await pipeline(
      Readable.from(buffers),
      createEntrySplitter(),
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 2)
  })

  t.test('as ndjson formatted', async t => {
    let data = '{"type":"home-gallery/database@1.3","created":"2024-07-10T20:07:25.084Z","data":[\n'
    data += '{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","hash":"99e61930141e8afff0d6d8c52997ec7295d62fd2","type":"image","files":[{"id":"4b157a9dc0e4baf45ab0ef65c32832566ab0d1e5","index":"files"}],"previews":["4b/15/7a9dc0e-image-preview-1920.jpg"],"width":4000,"height":3000},\n'
    data += '{"id":"d8b25bd1674e0f4b23695e7518a1e5932dac6ad8","hash":"d7496b6da889280fc0c175b9b6e3a5326097d023","type":"image","files":[{"id":"d8b25bd1674e0f4b23695e7518a1e5932dac6ad8","index":"files"}],"previews":["d8/b2/5bd1674-image-preview-1920.jpg"],"width":4000,"height":3000}\n'
    data += ']}'
    const buffers = [
      Buffer.from(data)
    ]
    const entries = []


    await pipeline(
      Readable.from(buffers),
      createEntrySplitter(),
      through(function(entry, _, cb) {
        entries.push(entry)
        cb()
      })
    )


    t.same(entries.length, 2)
  })

})
