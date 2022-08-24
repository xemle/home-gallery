const { getEntryMetaByKey } = require('./utils')

const atob = bytes => Buffer.from(bytes).toString('base64')

const browserEncoder = values => {
  const normalized = values
    .filter((_, i) => i % 3 === 0)
    .map(value => +(3 * Math.sqrt(Math.min(1, Math.max(0, value / 2.875)))).toFixed())
  const len = Math.ceil(normalized.length / 4)
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = ((normalized[i * 4] & 3) << 6) ^
      (((normalized[i * 4 + 1] || 0) & 3) << 4) ^
      (((normalized[i * 4 + 2] || 0) & 3) << 2) ^
      ((normalized[i * 4 + 3] || 0) & 3)
  }
  return atob(bytes)
}

const getSimilarityHash = entry => {
  const embeddings = getEntryMetaByKey(entry, 'similarityEmbeddings')
  if (!embeddings || !embeddings.data || !embeddings.data.length) {
    return {}
  }
  return {
    similarityHash: browserEncoder(embeddings.data)
  }
}

module.exports = {
  getSimilarityHash
}