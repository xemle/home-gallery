const t = require('tap')

const createHash = require('./hash')

t.test('createHash', async t => {
  t.test('basic', async t => {
    t.same(createHash('HomeGallery'), '6f0cb378270c4aad9772e77e9f742e28624b94a6')
  })
})