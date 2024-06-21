import t from 'tap'

import { serialize, createHash } from '@home-gallery/common'

import { FileStore } from './file-store.js'
import { ObjectStore } from './object-store.js'

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

  beforeTree(name, files, hash) {
    this.calls.push(`beforeTree: ${hash} ${name} with ${files.length} files`)
    return true
  }

  visitEntry(name, _, hash) {
    this.calls.push(`visitEntry: ${hash} ${name}`)
    return true
  }

  afterTree(name, _, hash) {
    this.calls.push(`afterTree:  ${hash} ${name}`)
  }
}

t.test('ObjectStore', async t => {

  t.test('addFileStore', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:sub/IMG_4321.JPG',
    ].map(toEntry)
    const fileStore = new FileStore()
    fileStore.addEntries(entries)

    const store = new ObjectStore()
    const rootId = store.addFileStore(fileStore)

    t.same(rootId, 'e8f4647acfdbdd3b033d092e464d66d573713d6c')
  })

  t.test('addFileStore with mergeCount 2', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:sub/IMG_4321.JPG',
      'files:sub/subsub/IMG_5678.JPG',
    ].map(toEntry)
    const fileStore = new FileStore()
    fileStore.addEntries(entries)

    const store = new ObjectStore()
    const rootId = store.addFileStore(fileStore, 2)

    t.same(rootId, 'e4b652c96e81bcda262fa8d641bec87ba4ac47e9')
    let obj = store.getByHash(rootId)
    t.match(obj, [{
      type: 'tree',
      name: 'files',
      hash: '1e60a8d92056f0ed17cbd97a3a3455793aef3113'
    }])
    obj = store.getByHash('1e60a8d92056f0ed17cbd97a3a3455793aef3113')
    t.match(obj, [{
      type: 'entry',
      name: 'IMG_1234.JPG',
      hash: 'd00bb71cc12c4707cd48acd13468856f7e3fd3f3'
    }, {
      type: 'tree',
      name: 'sub',
      hash: '61ebc7d3e891681944cebe27425f283ba8dbdc3d'
    }])
    obj = store.getByHash('61ebc7d3e891681944cebe27425f283ba8dbdc3d')
    t.match(obj, [{
      type: 'entry',
      name: 'IMG_4321.JPG',
      hash: '3e272bb5e74de96025351f5e8a868e68993eca4f'
    }, {
      type: 'entry',
      name: 'subsub/IMG_5678.JPG',
      hash: 'ec40d43c454c56a4a7b07e54b8ddafdaecea5d2a'
    }])
  })

  t.only('addFileStore without merge of root node', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:IMG_4321.JPG',
      'pictures:IMG_5678.JPG',
    ].map(toEntry)
    const fileStore = new FileStore()
    fileStore.addEntries(entries)

    const store = new ObjectStore()
    const rootId = store.addFileStore(fileStore, 3)

    t.same(rootId, '315cfc832aba5e3aeb0015ea4dcc2194395f7d09')
    let obj = store.getByHash(rootId)
    t.match(obj, [{
      type: 'tree',
      name: 'files',
      hash: '80cd40ee4492f62de9cbaab6f33093386cbd8d9a'
    }, {
      type: 'tree',
      name: 'pictures',
      hash: 'c1b58dca335a8301d336a06aef66075ed45bd651'
    }])
    obj = store.getByHash('80cd40ee4492f62de9cbaab6f33093386cbd8d9a')
    t.match(obj, [{
      type: 'entry',
      name: 'IMG_1234.JPG',
      hash: 'd00bb71cc12c4707cd48acd13468856f7e3fd3f3'
    }, {
      type: 'entry',
      name: 'IMG_4321.JPG',
      hash: 'ab406de895572552c5dfcc1c54e9c8b18f1209a0'
    }])
    obj = store.getByHash('c1b58dca335a8301d336a06aef66075ed45bd651')
    t.match(obj, [{
      type: 'entry',
      name: 'IMG_5678.JPG',
      hash: '6ce9c2ca4eb25027ed50ebef3110b38c45003c0e'
    }])
  })

  t.test('getById', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:sub/IMG_4321.JPG',
    ].map(toEntry)
    const fileStore = new FileStore()
    fileStore.addEntries(entries)

    const store = new ObjectStore()
    const rootId = store.addFileStore(fileStore)

    let obj = store.getByHash(rootId)
    t.same(obj, [{
      type: 'tree',
      name: 'files',
      hash: 'c0507caa2f72bac83ad6990da76ba76807d8db3b'
    }])

    obj = store.getByHash('c0507caa2f72bac83ad6990da76ba76807d8db3b')
    t.match(obj, [{
      type: 'entry',
      name: 'IMG_1234.JPG',
      hash: 'd00bb71cc12c4707cd48acd13468856f7e3fd3f3',
      entry: { id: 0 }
    }, {
      type: 'tree',
      name: 'sub',
      hash: '87d490f669477d9415075b5d1e497a6518f34f71'
    }])
  })

  t.test('hash generation', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:sub/IMG_4321.JPG',
    ].map(toEntry)
    const fileStore = new FileStore()
    fileStore.addEntries(entries)

    const store = new ObjectStore()
    store.addFileStore(fileStore)

    const hash = 'c0507caa2f72bac83ad6990da76ba76807d8db3b'
    let obj = store.getByHash(hash)
    t.ok(obj)

    const data = obj.map(o => `${o.hash}  ${o.name}`).join('\n')
    t.same(createHash(data), hash)
  })

  t.test('walk', async t => {
    const entries = [
      'files:IMG_1234.JPG',
      'files:sub/IMG_4321.JPG',
      'files:sub/subsub/IMG_5678.JPG',
    ].map(toEntry)
    const fileStore = new FileStore()
    fileStore.addEntries(entries)

    const store = new ObjectStore()
    const rootId = store.addFileStore(fileStore, 2)

    const callVisitor = new CallVisitor()
    store.walk(rootId, callVisitor)
    t.same(callVisitor.calls, [
      'beforeTree: e4b652c96e81bcda262fa8d641bec87ba4ac47e9  with 1 files',
      'beforeTree: 1e60a8d92056f0ed17cbd97a3a3455793aef3113 files with 2 files',
      'visitEntry: d00bb71cc12c4707cd48acd13468856f7e3fd3f3 IMG_1234.JPG',
      'beforeTree: 61ebc7d3e891681944cebe27425f283ba8dbdc3d sub with 2 files',
      'visitEntry: 3e272bb5e74de96025351f5e8a868e68993eca4f IMG_4321.JPG',
      'visitEntry: ec40d43c454c56a4a7b07e54b8ddafdaecea5d2a subsub/IMG_5678.JPG',
      'afterTree:  61ebc7d3e891681944cebe27425f283ba8dbdc3d sub',
      'afterTree:  1e60a8d92056f0ed17cbd97a3a3455793aef3113 files',
      'afterTree:  e4b652c96e81bcda262fa8d641bec87ba4ac47e9 ',
    ])
  })

})