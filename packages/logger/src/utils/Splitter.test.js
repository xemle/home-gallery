const t = require('tap')

const Splitter = require('./Splitter')

t.test('Init', async t => {
  const splitter = new Splitter()
  t.same(await splitter.next(), { done: true })
  t.same(await splitter.next(), { done: true })
})

t.test('append', async t => {
  const splitter = new Splitter()
  splitter.append('foo\n')
  t.same(await splitter.next(), { value: 'foo\n', done: false })
  t.same(await splitter.next(), { done: true })
  t.same(await splitter.next(), { done: true })
})

t.test('partial append', async t => {
  const splitter = new Splitter()
  splitter.append('foo')
  t.same(await splitter.next(), { done: true })
  splitter.append('\n')
  t.same(await splitter.next(), { value: 'foo\n', done: false })
  t.same(await splitter.next(), { done: true })
  splitter.append('bar')
  t.same(await splitter.next(), { done: true })
})

