import { Entry } from '../entry'

import { uniqBy } from './utils'

const euclideanDistance = (arr1: number[] | Float32Array, arr2: number[] | Float32Array) => {
  if (arr1.length !== arr2.length)
    throw new Error('euclideanDistance: arr1.length !== arr2.length')

  const desc1 = Array.from(arr1)
  const desc2 = Array.from(arr2)

  return Math.sqrt(
      desc1
          .map((val, i) => val - desc2[i])
          .reduce((res, diff) => res + Math.pow(diff, 2), 0)
  )
}

const euclideanDistance_old = (a, b) => {
  const max = Math.min(a.length, b.length)
  let result = 0
  for (let i = 0; i < max; i++) {
    const diff = a[i] - b[i]
    result += diff * diff
  }
  return Math.sqrt(result)
}

export const execFaces = (entries: Entry[], descriptor) => {
  if (!descriptor) {
    return entries
  }
  const t0 = Date.now()
  const comparableEntries = entries.filter(entry => entry.faces.length > 0)
  const t1 = Date.now()
  const similar = []
  comparableEntries.forEach(entry => {
    entry.faces.forEach(face => {
      similar.push({
        entry,
        similarity: euclideanDistance(descriptor, face.descriptor)
      })
    })
  })
  const t2 = Date.now()
  similar.sort((a, b) => (b.similarity - a.similarity) < 0 ? 1 : -1)
  const result = similar.map(s => s.entry).filter(uniqBy(v => v.id))
  const t3 = Date.now()
  console.log(`Face search: Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms`)
  return result
}