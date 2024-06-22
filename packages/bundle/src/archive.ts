import { createWriteStream, statSync } from 'fs'
import { mkdir } from 'fs/promises'
import path from 'path'
import { createGzip } from 'zlib'
import tar from 'tar-fs'

import { FilterFunction } from './filter.js'
import { logger } from './log.js'

export interface MapFunction {
  (name: string): string
}

const log = logger('archive')

export const writeArchive = async (dir: string, filter: FilterFunction, mapName: MapFunction, archivePrefix: string, outputFilename: string) => {
  const tarStream = tar.pack(dir, {
    ignore: (name: string) => {
      const relative = path.relative(dir, name)
      const allow = filter(relative)
      allow ? log.debug(`Filter: + ${relative}`) : log.trace(`Filter: - ${relative}`)
      return !allow
    },
    map: (header: tar.Headers) => {
      const name = mapName(header.name)
      name != header.name ? log.debug(`Map: ${header.name} -> ${name}`) : log.trace(`Map: ${header.name} (keep)`)
      header.name = `${archivePrefix}${name}`
      return header
    }
  })
  await mkdir(path.dirname(outputFilename), {recursive: true})

  return new Promise((resolve, reject) => {
    tarStream
        .pipe(createGzip())
        .pipe(createWriteStream(outputFilename))
        .on('close', () => resolve(void 0))
        .on('error', (error: Error) => reject(error))
  })
}
