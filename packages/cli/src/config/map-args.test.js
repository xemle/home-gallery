const t = require('tap')

const { mapArgs, mapConfig, getMissingPaths, validatePaths } = require('./map-args')

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

  t.test('test function', async t => {
    t.match(mapArgs({foo: [undefined]}, {bar: true}, {foo: {path: 'bar', test: () => false}}), {bar: true})
    t.match(mapArgs({foo: [true]}, {bar: true}, {foo: {path: 'bar', test: () => true}}), {bar: [true]})
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

t.test('getMissingPaths', async t => {
  t.test('empty paths', async t => {
    t.match(getMissingPaths({}), [])
    t.match(getMissingPaths({}, []), [])
    t.match(getMissingPaths({foo: true}, []), [])
  })

  t.test('no missing paths', async t => {
    t.match(getMissingPaths({foo: true, bar: {baz: 4}}, ['foo', 'bar', 'bar.baz']), [])
  })

  t.test('missing paths', async t => {
    t.match(getMissingPaths({foo: { bar: {baz: 4}}}, ['foo.bar.baz', 'foo.bar.zoo']), ['foo.bar.zoo'])
  })
})

t.test('validatePaths', async t => {
  t.test('happy path', async t => {
    validatePaths({foo: true, bar: {baz: 4}}, ['foo', 'bar.baz'])
  })

  t.test('Throw error on missing path', async t => {
    try {
      validatePaths({foo: true, bar: {baz: 4}}, ['foo', 'bar.baz', 'bar.zoo'])
      t.fail('Expect an exception')
    } catch (expected) { }
  })

})
