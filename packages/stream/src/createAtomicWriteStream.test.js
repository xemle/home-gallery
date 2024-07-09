import t from 'tap'
import path from 'path'
import { unlink, access, readFile, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { pipeline } from 'stream/promises'
import { Readable, Transform } from 'stream'

import { createTmpFile } from '@home-gallery/common'

import { createAtomicWriteStream, wrapRenameStream } from './createAtomicWriteStream.js'

t.only('createAtomicWriteStream', async t => {
  t.test('basic', async t => {
    const filename = await createTmpFile(path.resolve(tmpdir(), `database-${new Date().getTime()}.db`))

    const readable = Readable.from([Buffer.from('abc')])
    const writable = await createAtomicWriteStream(filename)


    await pipeline(
      readable,
      writable
    )


    const data = await readFile(filename, 'utf8')
    t.same(data, 'abc')
    await rm(filename, {recursive: true})
  })
})

t.only('wrapRenameStream', async t => {
  const buffers = 'abc'.split('').map(char => Buffer.from(char))

  const filename = await createTmpFile(path.resolve(tmpdir(), `database.db`))
  const tmp = filename + '.tmp'
  await writeFile(tmp, 'foo')

  const exists = file => access(file).then(() => true, () => false)

  t.test('basic', async t => {
    const writeable = new Transform({
      transform(chunk, enc, cb) {
        cb()
      }
    })

    const wrap = wrapRenameStream(writeable, tmp, filename)


    await pipeline(
      Readable.from(buffers),
      wrap,
    )

    t.same(await exists(tmp), false)
    t.same(await exists(filename), true)


    await unlink(filename)
  })

  t.test('write error', async t => {
    let transformCount = 0
    const writeable = new Transform({
      transform(chunk, enc, cb) {
        transformCount++
        cb(transformCount == 2 ? new Error('Write error') : null)
      }
    })

    const wrap = wrapRenameStream(writeable, tmp, filename)


    await pipeline(
      Readable.from(buffers),
      wrap,
    ).catch(() => {})


    t.same(await exists(tmp), false)
    t.same(await exists(filename), false)
  })

  t.test('flush error', async t => {
    const writeable = new Transform({
      transform(chunk, enc, cb) {
        cb()
      },
      flush(cb) {
        cb(new Error('Flush error'))
      }
    })

    const wrap = wrapRenameStream(writeable, tmp, filename)


    await pipeline(
      Readable.from(buffers),
      wrap,
    ).catch(() => {})


    t.same(await exists(tmp), false)
    t.same(await exists(filename), false)
  })
})
