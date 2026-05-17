// @ts-nocheck
import t from 'tap'
import {deepMerge} from './deep-merge.js'

t.test('merge with undefined', async t => {
  t.test('both', async t => {
    const merged = deepMerge(undefined, undefined)
    t.equal(merged, undefined)
  })
  t.test('one is undefined', async t => {
    const merged = deepMerge(undefined, 1)
    t.equal(merged, 1)
  })
  t.test('other is undefined', async t => {
    const merged = deepMerge(1, undefined)
    t.equal(merged, 1)
  })
})

t.test('merge with array', async t => {
  t.test('both', async t => {
    const merged = deepMerge([1], [3])
    t.same(merged, [1, 3])
  })
  t.test('one is array', async t => {
    const merged = deepMerge([1], {a: 1})
    t.same(merged, [1])
  })
  t.test('other is array', async t => {
    const merged = deepMerge(1, [2])
    t.same(merged, [2])
  })
})

t.test('merge with object', async t => {
  t.test('both', async t => {
    const merged = deepMerge({a: 1, b: 'foo'}, {b: 'bar', c: true})
    t.same(merged, {a: 1, b: 'bar', c: true})
  })
  t.test('one is object', async t => {
    const merged = deepMerge({a: 1}, true)
    t.same(merged, {a: 1})
  })
  t.test('other is object', async t => {
    const merged = deepMerge(1, {a: 2})
    t.same(merged, {a: 2})
  })
})

t.test('merge with scalar', async t => {
  t.test('both', async t => {
    const merged = deepMerge('foo', 'bar')
    t.equal(merged, 'bar')
  })
  t.test('other wins', async t => {
    t.equal(deepMerge('foo', true), true)
    t.equal(deepMerge('foo', 3), 3)
    t.equal(deepMerge('foo', 'bar'), 'bar')
  })
})

t.test('merge multiple', async t => {
  t.test('both', async t => {
    const merged = deepMerge({a: 1}, {b: [1, 2]}, {b: [3]}, {c: true})
    t.same(merged, {a: 1, b: [1, 2, 3], c: true})
  })
})

