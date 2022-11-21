const t = require('tap')

const { mapArgs, mapConfig } = require('./map-args')

t.test('mapArgs', async t => {
  t.test('empty', async t => {
    t.match(mapArgs({}, {}, {}), {})
  })

  t.test('empty args', async t => {
    t.match(mapArgs({}, {foo: true}, {}), {foo: true})
  })

  t.test('empty mappings', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: true}, {}), {foo: true})
  })

  t.test('simple mapping', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: true}, {foo: 'foo'}), {foo: 'bar'})
  })

  t.test('path mapping', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: { baz: true}}, {foo: 'foo.baz'}), {foo: {baz: 'bar'}})
  })

  t.test('value mapping', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: true}, {foo: {path: 'foo', map: v => v.toUpperCase()}}), {foo: 'BAR'})
  })

  t.test('add value', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: true}, {foo: {path: 'foo', type: 'add'}}), {foo: ['bar']})
  })

  t.test('add values', async t => {
    t.match(mapArgs({foo: ['bar', 'baz']}, {foo: true}, {foo: {path: 'foo', type: 'add'}}), {foo: ['bar', 'baz']})
  })

  t.test('add and map value', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: ['BAZ']}, {foo: {path: 'foo', type: 'add', map: v => v.toUpperCase()}}), {foo: ['BAZ', 'BAR']})
  })

  t.test('add and map value in path', async t => {
    t.match(mapArgs({foo: 'bar'}, {foo: {bar: ['BAZ']}}, {foo: {path: 'foo.bar', type: 'add', map: v => v.toUpperCase()}}), {foo: {bar: ['BAZ', 'BAR']}})
  })

})

t.test('mapConfig', async t => {
  t.test('empty mappings', async t => {
    t.match(mapConfig({}, {}), {})
    t.match(mapConfig({foo: true}, {}), {foo: true})
  })

  t.test('empty config', async t => {
    t.match(mapConfig({}, {foo: true}), {})
  })

  t.test('overwrite mapping', async t => {
    t.match(mapConfig({foo: 'bar'}, {foo: true}), {foo: true})
  })

  t.test('mapping function', async t => {
    t.match(mapConfig({foo: 'bar'}, {foo: v => v.toUpperCase()}), {foo: 'BAR'})
  })

  t.test('mapping function on array', async t => {
    t.match(mapConfig({foo: ['bar', 'baz']}, {foo: v => v.toUpperCase()}), {foo: ['BAR', 'BAZ']})
  })
})

