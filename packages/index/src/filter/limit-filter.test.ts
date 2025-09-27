import t from 'tap'
import type { Stats } from 'fs';

import { getNewFileLimit, createLimitFilter } from './limit-filter.js'

t.test('getNewFileLimit', async t => {
  // count: init, offset, factor => result
  // 0: 10, 0, 0 => 10
  // 10: 10, 20, 5 => 20
  // 30: 10, 20, 15 => 20
  // 50: 10, 20, 25 => 25
  // 75: 10, 20, 37 => 30
  t.test('Initial', async t => {
    const limit = getNewFileLimit(0, '10,20,1.5,30')
    t.equal(limit, 10, `Expected initial limit of 10 but was ${limit}`)
  })
  t.test('offset', async t => {
    const limit = getNewFileLimit(10, '10,20,1.5,30')
    t.equal(limit, 20, `Expected offset limit of 20 but was ${limit}`)
  })
  t.test('factor', async t => {
    const limit = getNewFileLimit(50, '10,20,1.5,30')
    t.equal(limit, 25, `Expected factor limit of 25 but was ${limit}`)
  })
  t.test('max', async t => {
    const limit = getNewFileLimit(75, '10,20,1.5,30')
    t.equal(limit, 30, `Expected max limit of 30 but was ${limit}`)
  })
})

t.test('createLimitFilter', async t => {
  let entries = [
    {filename: 'file-01'},
    {filename: 'file-04'},
    {filename: 'file-07'},
  ]
  const filename2Entry = entries.reduce((result, entry) => { result[entry.filename] = entry; return result }, {})

  const filter = createLimitFilter(entries.length, filename2Entry, '2,2,1,2', () => true)
  const paths = [
    'file-01',
    'file-02',
    'file-03',
    'file-04',
    'file-05',
    'file-06',
    'file-07',
  ]
  const results = paths.map(path => filter(path, {} as Stats))
  const expected = [
    true,  // file-01 existing
    true,  // file-02 new
    true,  // file-03 new
    true,  // file-04 existing
    false, // file-05 skiped
    false, // file-06 skiped
    true,  // file-07 existing
  ]
  t.same(results, expected, `Expected ${paths.filter((_, i) => expected[i]).join(', ')} but was ${paths.filter((_, i) => results[i]).join(', ')}`)
  t.same(filter.limitExceeded(), true, `Expected to be exceeded but was not`)
})