const t = require('tap')

const { getPreview } = require('./utils')

t.test('getPreview', async t => {
  t.test('basic', async t => {
    const entry = {
      previews: [
        '01/23/345-image-preview-320.jpg',
        '01/23/345-image-preview-800.jpg',
        '01/23/345-image-preview-1280.jpg',
        '01/23/345-image-preview-1920.jpg'
      ]
    }
    t.match(getPreview(entry, 'image', 1280), '01/23/345-image-preview-1280.jpg')
  })

  t.test('only images', async t => {
    const entry = {
      previews: [
        '01/23/345-image-preview-320.jpg',
        '01/23/345-image-preview-600.jpg',
        '01/23/345-video-preview-720.jpg',
      ]
    }
    t.match(getPreview(entry, 'image', 1280), '01/23/345-image-preview-600.jpg')
  })

  t.test('only video', async t => {
    const entry = {
      previews: [
        '01/23/345-image-preview-320.jpg',
        '01/23/345-image-preview-600.jpg',
        '01/23/345-video-preview-720.jpg',
      ]
    }
    t.match(getPreview(entry, 'video', 1280), '01/23/345-video-preview-720.jpg')
  })

  t.test('getmax', async t => {
    const entry = {
      previews: [
        '01/23/345-image-preview-320.jpg',
        '01/23/345-image-preview-800.jpg',
        '01/23/345-image-preview-1280.jpg',
        '01/23/345-image-preview-1920.jpg'
      ]
    }
    t.match(getPreview(entry, 'image'), '01/23/345-image-preview-1920.jpg')
  })

})
