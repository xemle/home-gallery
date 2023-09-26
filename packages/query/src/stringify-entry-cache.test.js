const t = require('tap')

const { createStringifyEntryCache } = require('./stringify-entry-cache')

t.test('Test cache on duplicated ids', async t => {
  const cache = createStringifyEntryCache()

  const entry1 = {
    id: '1',
    tags: ['tag1'],
  }

  const entry2 = {
    id: '1',
    tags: ['tag2'],
  }
  t.match(cache.stringifyEntry(entry1), /1\s+tag1/)
  t.match(cache.stringifyEntry(entry2), /1\s+tag2/, 'Cache should match on object not on entry id')
})