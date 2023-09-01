const t = require('tap')

const { createTags, mergeTags, isSame, hasWriteableTags } = require('./meta')
const exp = require('constants')

t.test('createTags', async t => {
  t.test('basic', async t => {
    const entry = {
      tags: ['foo']
    }
    const expected = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    t.same(createTags(entry), expected)
  })

})

t.test('mergeTags', async t => {
  t.test('empty files', async t => {
    const orig = {
    }
    const other = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    const expected = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    t.same(mergeTags(orig, other), expected)
  })

  t.test('Same tags', async t => {
    const orig = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    const other = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    const expected = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    t.same(mergeTags(orig, other), expected)
  })

  t.test('Update tags', async t => {
    const orig = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    const other = {
      'XMP-dc:Subject': ['bar'],
      'XMP-digiKam:TagsList': ['bar'],
      'XMP-lr:HierarchicalSubject': ['bar'],
    }
    const expected = {
      'XMP-dc:Subject': ['bar'],
      'XMP-digiKam:TagsList': ['bar'],
      'XMP-lr:HierarchicalSubject': ['bar'],
    }
    t.same(mergeTags(orig, other), expected)
  })

  t.test('Partial update tags', async t => {
    const orig = {
      'XMP-dc:Subject': ['foo'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    const other = {
      'XMP-digiKam:TagsList': ['bar'],
    }
    const expected = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['bar'],
      'XMP-lr:HierarchicalSubject': ['foo'],
    }
    t.same(mergeTags(orig, other), expected)
  })

  t.test('Keep only writeable tags', async t => {
    const orig = {
      unsupported: 'tag',
      'XMP-dc:Subject': ['foo'],
    }
    const other = {
      'XMP-digiKam:TagsList': ['bar'],
    }
    const expected = {
      'XMP-dc:Subject': ['foo'],
      'XMP-digiKam:TagsList': ['bar'],
    }
    t.same(mergeTags(orig, other), expected)
  })

  t.test('Filter supported', async t => {
    const orig = {
      unsupported: 'tag',
      'XMP-dc:Subject': ['foo'],
    }
    const expected = {
      'XMP-dc:Subject': ['foo'],
    }
    t.same(mergeTags(orig), expected)
  })


})

t.test('isSame', async t => {
  t.test('basic array', async t => {
    const a = {
      tags: ['foo']
    }
    const b = {
      tags: ['foo']
    }
    t.same(isSame(a, b), true)
  })

  t.test('different array values', async t => {
    const a = {
      tags: ['foo']
    }
    const b = {
      tags: ['foo', 'bar']
    }
    t.same(isSame(a, b), false)
  })

})

t.test('hasWriteableTags', async t => {
  t.test('empty tag list', async t => {
    const empty = {
      'XMP-dc:Subject': [],
      'XMP-digiKam:TagsList': [],
      'XMP-lr:HierarchicalSubject': [],
    }
    t.same(hasWriteableTags(empty), false)
  })
})
