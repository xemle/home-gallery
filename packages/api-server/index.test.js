import t from 'tap'
import fetch from 'node-fetch'
import fs from 'fs/promises'

import { runCli, waitForUrl } from './test-utils.js'

t.test('API Server', async t => {
  let child
  const port = 23080
  const url = `http://localhost:${port}`

  t.before(async () => {
    child = runCli('node', ['index.js'], { env: {PORT: '23080'}})
    console.log(`Starting api server with pid ${child.pid}`)
    await waitForUrl(`${url}/health`)
    console.log(`Api server is up and running on ${url}`)
  })

  t.after(async () => {
    return new Promise((resolve, rejects) => {
      console.log(`Stop server`)
      process.kill(child.pid)
      child.on('exit', code => code == 0 ? resolve() : rejects(new Error(`Server existed with code ${code}`)))
    })
  })

  t.test('embeddings', async t => {
    const body = await fs.readFile('sample.jpg')
    const data = await fetch(`${url}/embeddings`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'image/jpeg'
      }
    }).then(res => res.json())
    t.match(data, {
      srcSha1sum: '17f5e000be30d7915fe161a03db2773de279df1f',
      model: 'mobilenet',
      version: 'v1_1.0',
    })
    t.match(data.data.length, 1024)
  })

  t.test('objects', async t => {
    const body = await fs.readFile('sample-2.jpg')
    const data = await fetch(`${url}/objects`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'image/jpeg'
      }
    }).then(res => res.json())
    t.match(data, {
      srcSha1sum: 'c3328f60fd4fc6c85bfff3fdba9e2f067c135e5f',
      model: 'cocossd',
      version: 'mobilenet_v2',
      width: 300,
      height: 188,
    })
    t.match(data.data.length, 20)
    t.same(data.data.map(o => o.class), [
      'person',
      'person',
      'person',
      'person',
      'book',
      'book',
      'book',
      'book',
      'chair',
      'book',
      'dining table',
      'potted plant',
      'book',
      'person',
      'book',
      'book',
      'book',
      'potted plant',
      'book',
      'book',
    ])
  })

  t.test('faces', async t => {
    const body = await fs.readFile('sample-2.jpg')
    const data = await fetch(`${url}/faces`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'image/jpeg'
      }
    }).then(res => res.json())
    t.match(data, {
      srcSha1sum: 'c3328f60fd4fc6c85bfff3fdba9e2f067c135e5f',
      model: 'face-api',
      width: 300,
      height: 188,
    })
    t.match(data.data.length, 6)
    t.same(data.data.map(o => o.gender), [
      'male',
      'male',
      'male',
      'male',
      'male',
      'female'
    ])
  })
})
