import t from 'tap'

import { serialize, createHash } from '@home-gallery/common'

import { ObjectStoreV2, createYearGroupedMonthPathMapper } from './object-store-v2.js'

t.test('ObjectStoreV2', async t => {

  t.test('addEntries', async t => {
    const entries = [
      '2025-03-12:files:IMG_1234.JPG',
      '2025-03-02:files:sub/IMG_4321.JPG',
    ].map(toEntry)

    const store = new ObjectStoreV2()
    const rootId = store.addEntries(entries)

    t.same(rootId, '04cf50031161f35b0378ec9143dedfdb522e03f6')
  })

  t.test('addEntriesWithDifferentMonthPath', async t => {
    const entries = [
      '2025-03-12:files:IMG_1234.JPG',
      '2025-01-30:files:sub/IMG_4321.JPG',
      '2024-12-24:files:xmas/IMG_1678.JPG',
    ].map(toEntry)

    const store = new ObjectStoreV2()
    const rootId = store.addEntries(entries)

    t.same(rootId, '95b47a75671bef62eb14052a418b937fe6b9cc99')
  })

  t.test('addEntriesWithDifferentYearPath', async t => {
    const entries = [
      '2025-03-12:files:IMG_1234.JPG',
      '2024-12-24:files:xmas/IMG_1678.JPG',
    ].map(toEntry)

    const store = new ObjectStoreV2()
    const rootId = store.addEntries(entries)

    t.same(rootId, '29a42ee41e830c1f09950af3fad9a00b12965226')
  })
})

t.test('createYearGroupedMonthPathMapper', async t => {
  const currentYear = new Date().getFullYear()

  const mapper = createYearGroupedMonthPathMapper(4, 2)

  // Entry group is irgnored
  t.same(mapper(toEntry(`${currentYear}-03-16:Pictures:IMG_1336.JPG`, 5)), [`${currentYear}`, '03'])
  t.same(mapper(toEntry(`${currentYear}-02-28:Pictures:IMG_1335.JPG`, 4)), [`${currentYear}`, '02'])

  t.same(mapper(toEntry(`${currentYear-1}-07-22:Pictures:IMG_1244.JPG`, 3)), [`${currentYear-1}`, '07'])

  // Entries are grouped
  t.same(mapper(toEntry(`${currentYear-2}-05-01:Pictures:IMG_1235.JPG`, 2)), [`${currentYear-2}`, '08'])
  t.same(mapper(toEntry(`${currentYear-2}-06-23:Pictures:IMG_1234.JPG`, 1)), [`${currentYear-2}`, '08'])
})

function toEntry(s, i) {
  const [date, index, filename] = s.split(':')
  const entry = {
    id: i,
    date,
    hash: '',
    files: [{index, filename}]
  }
  entry.hash = createHash(serialize(entry, 'hash'))
  return entry
}
