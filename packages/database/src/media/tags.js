const { reduceMeta, toArray } = require('./utils')

const addUniqValues = (result, values) => toArray(values).forEach(value => {
  if (!result.includes(value)) {
    result.push(value)
  }
})

const getTags = entry => {
  const reduceFn = (tags, exif) => {
    addUniqValues(tags, exif.TagList)
    addUniqValues(tags, exif.HierarchicalSubject)
    addUniqValues(tags, exif.Keywords)
    addUniqValues(tags, exif.Subject)
    return tags
  }

  return reduceMeta(entry, 'exif', reduceFn, []).map(value => '' + value).sort()
}

module.exports = {
  getTags
}