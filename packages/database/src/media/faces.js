const { getEntryMetaByKey } = require('./utils')

const getFaces = (entry, minScore) => {
  const faces = getEntryMetaByKey(entry, 'faces')
  if (!faces) {
    return [];
  }

  const { width, height, data } = faces;
  return data
    .filter(face => face.alignedRect.score >= minScore)
    .map(face => {
      const { box } = face.alignedRect;
      const expressions = Object.keys(face.expressions)
        .map(key => { return {score: face.expressions[key], expression: key }})
        .filter(v => v.score > 0.3)
        .sort((a, b) => a.score - b.score < 0 ? 1 : -1)
        .map(v => v.expression)
        .slice(0, 2)

      return {
        age: +face.age.toFixed(1),
        gender: face.genderProbability > 0.7 ? face.gender : 'unknown',
        expressions,
        x: +(box.x / width).toFixed(3),
        y: +(box.y / height).toFixed(3),
        width: +(box.width / width).toFixed(2),
        height: +(box.height / height).toFixed(2),
        descriptor: Object.values(face.descriptor).map(value => +(value).toFixed(4))
      }
    })
}

module.exports = {
  getFaces
}