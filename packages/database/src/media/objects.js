const { getEntryMetaByKey } = require('./utils')

const getObjects = (entry, minScore) => {
  const objects = getEntryMetaByKey(entry, 'objects')
  if (!objects) {
    return []
  }
  const { width, height, data } = objects
  return data
    .filter(object => object.score > minScore)
    .map(object => {
      return {
        x: +(object.bbox[0] / width).toFixed(3),
        y: +(object.bbox[1] / height).toFixed(3),
        width: +(object.bbox[2] / width).toFixed(2),
        height: +(object.bbox[3] / height).toFixed(2),
        score: +object.score.toFixed(2),
        class: object.class
      }
    })
}

module.exports = {
  getObjects
}