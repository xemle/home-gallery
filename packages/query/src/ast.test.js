const t = require('tap')
const { parse: parseCb } = require('./parse')
const { createFilter: createFilterCb } = require('./ast')

const parse = query => new Promise((resolve, reject) => parseCb(query, (err, result) => err ? reject(err) : resolve(result)))
const createFilter = (ast, options) => new Promise((resolve, reject) => createFilterCb(ast, options, (err, result) => err ? reject(err) : resolve(result)))

const data = [
  {
    id: '1234567890',
    date: '2021-10-04T20:08:45',
    name: 'color.jpg',
    tags: ['foo', 'bar', 'baz']
  },
  {
    id: '0987654321',
    date: '2021-10-04T20:33:12',
    name: 'sunset.jpg',
    tags: ['sea', 'vacation']
  },
  {
    id: '1223344556',
    date: '2021-10-04T21:10:22',
    name: 'mountain.jpg',
    tags: ['snow', 'alps']
  }
]

const defaultOptions = {
  textFn: v => [v.id.slice(0, 7), v.date, v.name, ...v.tags].join(' ')
}

const execQuery = async (query, options) => {
  const ast = await parse(query)
  //console.log(JSON.stringify(ast, null, 2))
  const filter = await createFilter(ast, {...defaultOptions, ...options})
  const result = data.filter(filter)
  return result.map(e => e.id.slice(0, 4))
}

t.test('Simple', async t => {
  t.test('Single Term', async t => {
    t.same(await execQuery('bar'), ['1234'])
  })

  t.test('Two Terms', async t => {
    t.same(await execQuery('bar color'), ['1234'])
  })
})

t.test('Complex', async t => {
  t.test('not with terms', async t => {
    t.same(await execQuery('not (bar or snow)'), ['0987'])
  })
})

t.test('Not yet implemented', async t => {
  t.test('key:value', async t => {
    t.rejects(execQuery('foo:bar'))
  })

  t.test('Compare', async t => {
    t.rejects(execQuery('foo >= bar'))
  })

  t.test('List', async t => {
    t.rejects(execQuery('foo in (bar, baz)'))
  })

  t.test('Range', async t => {
    t.rejects(execQuery('foo in [2019:2021]'))
  })
})

t.test('unknownExpressionHandler', async t => {
  t.test('Allow all fallback', async t => {
    const allowAll = () => true
    t.same(await execQuery('foo:bar baz', {unknownExpressionHandler: () => allowAll}), ['1234'])
  })
})
