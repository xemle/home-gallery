import { Entry } from '../entry'

export const cosineSimilarity = (a, b) => {
  let denA = 0
  let denB = 0
  let num = 0
  for (let i = 0; i < a.length; i++) {
    let ai = a.charCodeAt(i) & 255
    let bi = b.charCodeAt(i) & 255
    for (let j = 0; j < 4; j++) {
      let av = (ai & 3)
      let bv = (bi & 3)
      av = av * av / 9
      bv = bv * bv / 9
      num += av * bv
      denA += av * av
      denB += bv * bv

      ai = (ai >> 2)
      bi = (bi >> 2)
    }
  }

  return num / (Math.sqrt(denA) * Math.sqrt(denB))
}

export const execSimilar = (entries: Entry[], similarityHash) => {
  if (!similarityHash) {
    return entries
  }
  const t0 = Date.now()
  const comparableEntries = entries.filter(entry => !!entry.similarityHash)
  const t1 = Date.now()
  const similar = comparableEntries.map(entry => {
    return {
      entry,
      similarity: cosineSimilarity(similarityHash, entry.similarityHash)
    }
  })
  .filter(item => item.similarity > 0.5)
  const t2 = Date.now()
  similar.sort((a, b) => (a.similarity - b.similarity) < 0 ? 1 : -1)
  const result = similar.map(s => s.entry)
  const t3 = Date.now()
  console.log(`Similarity search: Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms`)
  return result
}