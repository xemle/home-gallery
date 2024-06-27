import t from 'tap'

import { serialize, createHash } from '@home-gallery/common'

import { FileStore } from './file-store.js'

const toEntry = (s, i) => {
  const [index, filename] = s.split(':')
  const entry = {
    id: i,
    hash: '',
    files: [{index, filename}]
  }
  entry.hash = createHash(serialize(entry, 'hash'))
  return entry
}

class CallVisitor {
  calls = []
  visitFile(node) {
    this.calls.push(`visitFile: ${node.name}`)
  }
  beforeDir(node) {
    this.calls.push(`beforeDir: ${node.name}`)
    return true
  }
  afterDir(node) {
    this.calls.push(`afterDir: ${node.name}`)
  }
}

t.test('FileStore', async t => {
  t.test('getByPath', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:IMG_4321.JPG',
    ].map(toEntry)
    const store = new FileStore()
    store.addEntries(entries)

    t.match(store.getByPath('files/IMG_1234.JPG'), {entry: {hash: 'd00bb71cc12c4707cd48acd13468856f7e3fd3f3'}})
    t.match(store.getByPath('files/IMG_4321.JPG'), {entry: {hash: 'ab406de895572552c5dfcc1c54e9c8b18f1209a0'}})
    t.equal(store.getByPath('unknown'), undefined)
  })

  t.test('getByPath with Window paths', async t => {
    const entries = [
      'files:dir\\IMG_1234.JPG',
    ].map(toEntry)
    const store = new FileStore()
    store.addEntries(entries)

    t.match(store.getByPath('files/dir/IMG_1234.JPG'), {entry: {hash: 'a7777398d6fe69792436757dcc0fc3b6cb8502f6'}})
  })

  t.test('getNodes', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:IMG_4321.JPG',
    ].map(toEntry)
    const store = new FileStore()
    store.addEntries(entries)

    const nodes = store.getNodes()
    t.match(nodes[0].path, 'files/IMG_1234.JPG')
    t.match(nodes[1].path, 'files/IMG_4321.JPG')
  })

  t.test('walk', async t => {
    const entries = [
      'files:sub/IMG_1234.JPG',
      'files:IMG_4321.JPG',
    ].map(toEntry)
    const store = new FileStore()
    store.addEntries(entries)

    const visitor = new CallVisitor()
    store.walk(visitor)

    t.same(visitor.calls, [
      'beforeDir: ',
      'beforeDir: files',
      'visitFile: IMG_4321.JPG',
      'beforeDir: sub',
      'visitFile: IMG_1234.JPG',
      'afterDir: sub',
      'afterDir: files',
      'afterDir: ',
    ])
  })
})
