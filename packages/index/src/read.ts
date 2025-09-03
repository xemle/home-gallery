import { readJsonGzip, promisify } from '@home-gallery/common';
import { IIndex, IIndexEntry } from './types.js'

const asyncReadJsonGzip = promisify(readJsonGzip) as (filename: string) => Promise<IIndex>

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
        return {data: [] as IIndexEntry[]} as IIndex
      }
      throw err
  });
}
