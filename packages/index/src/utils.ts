import path from 'path'
import { IIndexEntry } from './types.js'

export const getIndexName = (filename: string): string => path.basename(filename).replace(/\.[^.]+$/, '')

const unitToFactor = {
  'B': 1,
  'K': 1 << 10,
  'M': 1 << 20,
  'G': 1 << 30,
  'T': (1 << 30) * (1 << 10),
  'P': (1 << 30) * (1 << 20),
}

export const parseFilesize = (filesize: string): number | boolean => {
  const match = filesize.toUpperCase().match(/^(\d+(\.\d+)?)(([PTGMK])([B])?|[B])?$/)
  if (!match) {
    return false
  }
  const [_, size, _1, byte, unit] = match
  const factor = unitToFactor[unit || byte || 'B']
  return parseFloat(size) * factor
}

/**
 * Sorts directory descending and filename ascending
 *
 * This ensures:
 *
 * 1) Directory first
 * 2) Latest folers first for common year bases media directories
 * 3) Standard ascending file order in folders, where videos come last
 *
 * Example:
 *  2021
 *  2021/2021-12-24
 *  2021/2021-12-24/IMG_2034.jpg
 *  2021/2021-12-24/IMG_2035.jpg
 *  2021/2021-08-10
 *  2021/2021-08-10/IMG_1478.jpg
 *  2021/2021-08-10/VID_1479.jpg
 *  2020
 *  2020/2020-09-20
 */
export const byDirDescFileAsc = (a: IIndexEntry, b: IIndexEntry): number => {
  const aParts = a.filename.split(path.sep)
  const bParts = b.filename.split(path.sep)

  const minLen = Math.min(aParts.length, bParts.length)

  for (let i = 0; i < minLen; i++) {
    const aIsDir = i < aParts.length - 1 || a.isDirectory
    const bIsDir = i < bParts.length - 1 || b.isDirectory

    if (aParts[i] == bParts[i] && aIsDir && bIsDir)  {
      continue
    }

    if (aIsDir === bIsDir) {
      const rev = aIsDir ? 1 : -1
      return aParts[i] < bParts[i] ? rev : -1 * rev
    } else {
      return aIsDir ? -1 : 1
    }
  }

  return aParts.length < bParts.length ? -1 : 1
}
