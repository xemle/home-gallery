import { readJsonGzip, promisify } from '@home-gallery/common';

const asyncReadJsonGzip = promisify(readJsonGzip)

/**
 * @typedef {import('./types.d').IIndex} IIndex
 */
/**
 * @param {string} filename
 * @returns {Promise<IIndex>}
 */
export const readIndex = async (filename) => {
  return asyncReadJsonGzip(filename)
    .then(index => {
      if (index?.type != 'home-gallery/fileindex@1.0') {
        throw new Error(`Unknown file index format ${index && index.type || 'unknown'}. Please read CHANGELOG and migrate!`)
      }
      return index
    })
    .catch(err => {
      if (err?.code === 'ENOENT') {
        return {data: []}
      }
      throw err
  });
}
