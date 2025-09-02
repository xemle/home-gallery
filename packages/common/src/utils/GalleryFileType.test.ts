import t from 'tap'

import { GalleryFileType } from './GalleryFileType.js'

t.only('GalleryFileType', async t => {
  t.test('GalleryFileType', async t => {
    const fileType = new GalleryFileType('home-gallery/database@1.3')

    t.same(fileType.name, 'home-gallery/database')
    t.same(fileType.semVer.toString(), '1.3')
    t.same(fileType.toString(), 'home-gallery/database@1.3')
  })

  t.test('GalleryFileType with no version', async t => {
    const fileType = new GalleryFileType('home-gallery/acme')

    t.same(fileType.name, 'home-gallery/acme')
    t.same(fileType.semVer.toString(), '1.0')
    t.same(fileType.toString(), 'home-gallery/acme@1.0')
  })

  t.test('GalleryFileType with no version', async t => {
    t.same(GalleryFileType.isFileType('home-gallery/acme'), true)
    t.same(GalleryFileType.isFileType('home-gallery/database@1'), true)
    t.same(GalleryFileType.isFileType('home-gallery/database@1.3'), true)
    t.same(GalleryFileType.isFileType('home-gallery/database@1.3.2'), true)
  })

  t.test('isCompatible', async t => {
    t.same(new GalleryFileType('database@1.3').isCompatible(new GalleryFileType('database@1.1')), true)
    t.same(new GalleryFileType('database@1.3').isCompatible(new GalleryFileType('fileIndex@1.1')), false)
  })

  t.test('isCompatible with implicit minVersion', async t => {
    t.same(new GalleryFileType('database@2.1').isCompatible(new GalleryFileType('database@1.1')), false)
    t.same(new GalleryFileType('database@2.1').isCompatible(new GalleryFileType('database@2.0.0')), true)
    t.same(new GalleryFileType('database@2.1').isCompatible(new GalleryFileType('database@2.2')), false)
  })

  t.test('isCompatible with explicit minVersion', async t => {
    t.same(new GalleryFileType('database@2.1', '1.0.0').isCompatible(new GalleryFileType('database@1.1')), true)
    t.same(new GalleryFileType('database@2.1', '1.2.0').isCompatible(new GalleryFileType('database@1.1')), false)
  })

  t.test('isCompatibleType', async t => {
    t.same(new GalleryFileType('database@1.3').isCompatibleType('database@1.1'), true)
    t.same(new GalleryFileType('database@1.3').isCompatibleType('database@1.3.3'), true)
    t.same(new GalleryFileType('database@1.3').isCompatibleType('database@1.4'), false)

    t.same(new GalleryFileType('database@1.3').isCompatibleType('fileIndex@1.1'), false)
  })

})