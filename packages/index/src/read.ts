import { readJsonGzip, promisify } from '@home-gallery/common';
import { IIndex } from './types.js'

const asyncReadJsonGzip = promisify(readJsonGzip)

export async function readIndex(filename: string): Promise<IIndex> {
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
