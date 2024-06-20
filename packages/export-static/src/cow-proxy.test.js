import t from 'tap'

import { wrapCowProxy, unwrapCowProxy } from './cow-proxy.js'

t.test('wrapProxy with object', async t => {
  t.test('boolean', async t => {
    const base = {
      value: true
    }
    const proxy = wrapCowProxy(base)
    proxy.value = false
    t.match(proxy.value, false, 'Proxy should be false')
    t.match(base.value, true, 'Base should be true')
  })

  t.test('number', async t => {
    const base = {
      value: 0
    }
    const proxy = wrapCowProxy(base)
    proxy.value = 1
    t.match(proxy.value, 1, 'Proxy should be 1')
    t.match(base.value, 0, 'Base should be 0')
  })

  t.test('string', async t => {
    const base = {
      value: 'text'
    }
    const proxy = wrapCowProxy(base)
    proxy.value = 'city'
    t.match(proxy.value, 'city', 'Proxy should be city')
    t.match(base.value, 'text', 'Base should be text')
  })

  t.test('add property', async t => {
    const base = {
    }
    const proxy = wrapCowProxy(base)
    proxy.value = 'city'
    t.match(proxy.value, 'city', 'Proxy should be city')
    t.match(base.value, undefined, 'Base should be undefined')
  })

  t.test('delete property', async t => {
    const base = {
      value: 'text'
    }
    const proxy = wrapCowProxy(base)
    delete proxy.value
    t.match(proxy.value, undefined, 'Proxy should be undefined')
    t.match(base.value, 'text', 'Base should be text')
  })

})

t.test('wrapProxy with scalar', async t => {
  t.test('array', async t => {
    const base = {
      value: [1, 2]
    }
    const proxy = wrapCowProxy(base)
    proxy.value.push(3)
    console.log(proxy.value, JSON.stringify(proxy.value))
    t.match(proxy.value, [1, 2, 3], 'Proxy should be [1, 2, 3]')
    t.match(base.value, [1, 2], 'Base should be [1, 2]')
  })

  t.test('create new array', async t => {
    const base = {
    }
    const proxy = wrapCowProxy(base)
    proxy.tags = []
    proxy.tags.push('foo')


    t.same(proxy.tags[0], 'foo', 'Unwrap should be [foo]')
  })

  t.test('add existing array element', async t => {
    const base = {
      tags: []
    }
    const proxy = wrapCowProxy(base)
    proxy.tags.push('foo')

    t.equal(proxy.tags[0], 'foo', 'Tag should be foo')
  })

  t.test('object', async t => {
    const base = {
      value: {
        nested: true
      }
    }
    const proxy = wrapCowProxy(base)
    proxy.value.nested = false
    t.match(proxy.value.nested, false, 'Proxy should be nested')
    t.match(base.value.nested, true, 'Base should be true')
  })

})

t.test('unwrapProxy', async t => {
  t.test('array', async t => {
    const base = {
      value: [1, 2]
    }
    const proxy = wrapCowProxy(base)
    proxy.value.push(3)

    t.match(unwrapCowProxy(proxy), base, 'Unwrap should be [1, 2]')
  })

})

t.test('delete', async t => {
  t.test('array', async t => {
    const base = {
      value: [1, 2]
    }
    const proxy = wrapCowProxy(base)
    delete proxy.value[0]

    t.match(JSON.stringify(proxy.value), '[null,2]', 'Unwrap should be [null, 2]')
  })

  t.test('object', async t => {
    const base = {
      value: true
    }
    const proxy = wrapCowProxy(base)
    delete proxy.value

    t.match(JSON.stringify(proxy), '{}', 'Unwrap should be empty object {}')
  })

  t.test('object', async t => {
    const base = {
      value: true
    }
    const proxy = wrapCowProxy(base)
    delete proxy.value
    proxy.value = 'new'

    t.match(JSON.stringify(proxy), '{"value":"new"}', 'Unwrap should have a new value {value: "new"}')
  })
})
