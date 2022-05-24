const uniq = (v, i, a) => a.indexOf(v) === i;
const flatten = (r, v) => r.concat(v);

const stringifyEntry = entry => {
  return [
    entry.id.substring(0, 10),
    entry.type,
    entry.date ? entry.date.substring(0, 10) : '',
    entry.make,
    entry.model,
    entry.files ? entry.files[0].filename : '',
    entry.country,
    entry.state,
    entry.city,
    entry.road
  ]
  .concat(entry.tags || [])
  .concat((entry.objects || []).map(object => object.class).filter(uniq))
  .concat((entry.faces || []).map(face => face.expressions).reduce(flatten, []).filter(uniq))
  .concat((entry.faces || []).map(face => `${Math.trunc(face.age / 10) * 10}s`).reduce(flatten, []).filter(uniq))
  .join(' ')
  .toLowerCase()
}

module.exports = {
  stringifyEntry
}