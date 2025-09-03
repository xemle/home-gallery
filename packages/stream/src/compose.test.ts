import t from 'tap'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

import { through } from './through.js'

import { compose } from './compose.js'


t.only('compose', async t => {
  t.test('basic', async t => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = []


    await pipeline(
      Readable.from(data),
      compose(
        through((chunk, enc, cb) => {
          cb(null, chunk * 2)
        }),
        through((chunk, enc, cb) => {
          cb(null, chunk + 1)
        }),
      ),
      through((chunk, enc, cb) => {
        result.push(chunk)
        cb()
      })
    )


    t.same(result, [3, 5, 7, 9, 11, 13, 15, 17, 19, 21])
  })

  t.only('error in fist compose', async t => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = []

    let failed = false
    await pipeline(
      Readable.from(data),
      compose(
        through((chunk, enc, cb) => {
          cb(chunk > 5 ? new Error(`Max exceeded ${chunk}`) : null, chunk * 2)
        }),
        through((chunk, enc, cb) => {
          cb(null, chunk + 1)
        }),
      ),
      through((chunk, enc, cb) => {
        result.push(chunk)
        cb()
      })
    ).catch(() => failed = true)


    t.same(failed, true)
    t.same(result, [3, 5, 7, 9, 11])
  })

  t.test('error in last compose', async t => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = []

    let failed = false
    await pipeline(
      Readable.from(data),
      compose(
        through((chunk, enc, cb) => {
          cb(null, chunk * 2)
        }),
        through((chunk, enc, cb) => {
          cb(chunk > 10 ? new Error(`Max exceeded ${chunk}`) : null, chunk + 1)
        }),
      ),
      through((chunk, enc, cb) => {
        result.push(chunk)
        cb()
      })
    ).catch(() => failed = true)


    t.same(failed, true)
    t.same(result, [3, 5, 7, 9, 11])
  })

  t.only('error in first compose flush', async t => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = []

    let failed = false
    await pipeline(
      Readable.from(data),
      compose(
        through((chunk, enc, cb) => {
          cb(null, chunk * 2)
        }, (cb) => {
          cb(new Error(`Flush error`))
        }),
        through((chunk, enc, cb) => {
          cb(null, chunk + 1)
        }),
      ),
      through((chunk, enc, cb) => {
        result.push(chunk)
        cb()
      })
    ).catch(() => failed = true)


    t.same(failed, true)
  })

  t.test('error in last compose flush', async t => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = []

    let failed = false
    await pipeline(
      Readable.from(data),
      compose(
        through((chunk, enc, cb) => {
          cb(null, chunk * 2)
        }),
        through((chunk, enc, cb) => {
          cb(null, chunk + 1)
        }, (cb) => {
          cb(new Error(`Flush error`))
        }),
      ),
      through((chunk, enc, cb) => {
        result.push(chunk)
        cb()
      })
    ).catch(() => failed = true)


    t.same(failed, true)
  })
})