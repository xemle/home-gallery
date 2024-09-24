import t from 'tap'

import { serialize } from './serialize.js'

t.test('serialize', async t => {
  t.test('basic', async t => {
    const a = {
      u: undefined,
      n: null,
      b: true,
      N: 42.2,
      s: 'foo',
      a: [1,'bar'],
      o: {b:2,a:1}
    }
    const expected = `{"N":42.2,"a":[1,"bar"],"b":true,"n":null,"o":{"a":1,"b":2},"s":"foo","u":null}`
    t.same(serialize(a), expected)
  })

  t.test('exclude', async t => {
    const o = {
      s: 'text',
      hash: 'abc',
    }
    const expected = `{"s":"text"}`
    t.same(serialize(o, {hash: true}), expected)
  })

  t.test('sub exclude', async t => {
    const o = {
      s: 'text',
      o: {
        v: 42,
        hash: 'abc'
      },
    }
    const expected = `{"o":{"v":42},"s":"text"}`
    t.same(serialize(o, 'o.hash'), expected)
  })

  t.test('sub exclude with array', async t => {
    const o = {
      s: 'text',
      o: {
        v: 42,
        hash: 'abc'
      },
    }
    const expected = `{"o":{"v":42}}`
    t.same(serialize(o, ['o.hash', 's']), expected)
  })

  t.test('exclude array properties', async t => {
    const o = {
      a: [{
        s: 'foo',
        hash: 'abc'
      }, {
        s: 'bar',
        hash: '123'
      }]
    }
    const expected = `{"a":[{"s":"foo"},{"s":"bar"}]}`
    t.same(serialize(o, 'a.hash'), expected)
  })

})
