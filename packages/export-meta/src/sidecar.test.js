const t = require('tap')

const { selectSidecar } = require('./sidecar')

t.test('selectSidecar', async t => {
  t.test('empty files', async t => {
    t.match(selectSidecar('IMG_1234.JPG', []), 'IMG_1234.JPG.xmp', 'Sidecar default from main file')
  })

  t.test('main.xmp', async t => {
    t.match(selectSidecar('IMG_1234.JPG', ['IMG_1234.xmp', 'IMG_1234.JPG.xmp']), 'IMG_1234.JPG.xmp', 'Sidecar from main filename')
    t.match(selectSidecar('IMG_1234.JPG', ['IMG_1234.JPG.XMP', 'IMG_1234.JPG.xmp']), 'IMG_1234.JPG.XMP', 'First sidecar matches')
    t.match(selectSidecar('IMG_1234.JPG', ['IMG_1234.JPG.xmp2']), 'IMG_1234.JPG.xmp', 'Default sidecar')
  })

  t.test('base.xmp', async t => {
    t.match(selectSidecar('IMG_1234.JPG', ['IMG_1234.xmp']), 'IMG_1234.xmp', 'Sidecar from filename base')
    t.match(selectSidecar('IMG_1234.JPG', ['IMG_1234.xmp2']), 'IMG_1234.JPG.xmp', 'Default sidecar')
  })

})
