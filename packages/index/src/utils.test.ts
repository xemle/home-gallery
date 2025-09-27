import t from 'tap'

import { byDirDescFileAsc } from './utils.js'
import type { IIndexEntry } from './types.js'

t.test('Test descending dir', t => {
  let data = [
    {filename: 'f1'},
    {filename: 'a1'},
    {filename: 'd1', isDirectory: true},
    {filename: 'd2', isDirectory: true},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['d2', 'd1', 'a1', 'f1'], 'Dirs should before files')

  data = [
    {filename: 'd1', isDirectory: true},
    {filename: 'd1/f1'},
    {filename: 'd1/d2', isDirectory: true},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['d1', 'd1/d2', 'd1/f1'], 'Dir should before a file')

  data = [
    {filename: 'd2', isDirectory: true},
    {filename: 'd1', isDirectory: true},
    {filename: 'd3', isDirectory: true},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['d3', 'd2', 'd1'], 'Dir is descending')

  data = [
    {filename: 'd2', isDirectory: true},
    {filename: 'd1', isDirectory: true},
    {filename: 'd3', isDirectory: true},
    {filename: 'd2/f1'},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['d3', 'd2', 'd2/f1', 'd1'], 'Dir is descending')

  data = [
    {filename: 'D1', isDirectory: true},
    {filename: 'd1', isDirectory: true},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['d1', 'D1'], 'Dir is descending case sensitive')

  data = [
    {filename: '2010', isDirectory: true},
    {filename: '2010/VID_5678.MP4'},
    {filename: '2010/IMG_1234.JPG'},
    {filename: '2011/IMG_3456.jpg'},
    {filename: '2011/IMG_3456.jpg.xmp'},
    {filename: '2011/IMG_3456.xmp'},
    {filename: '2011/.galleryignore'},
    {filename: '2011', isDirectory: true},
  ] as IIndexEntry[]
  const expected = [
    '2011', '2011/.galleryignore', '2011/IMG_3456.jpg', '2011/IMG_3456.jpg.xmp', '2011/IMG_3456.xmp', 
    '2010', '2010/IMG_1234.JPG', '2010/VID_5678.MP4'
  ]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), expected, 'Tree structure does not match')

  t.end()
})

t.test('Test ascending file', t => {
  let data = [
    {filename: 'f3'},
    {filename: 'f1'},
    {filename: 'f2'},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['f1', 'f2', 'f3'], 'Files are ascending')

  data = [
    {filename: 'F1'},
    {filename: 'f1'},
  ] as IIndexEntry[]
  t.same(data.sort(byDirDescFileAsc).map(f => f.filename), ['F1', 'f1'], 'Files should be ascending casesensitive')

  t.end()
})
