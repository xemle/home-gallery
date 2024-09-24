import { Readable, Transform } from 'stream'

import { TStorage, TStorageEntry } from './storage'
import { TPlugin } from './plugin';

/**
 * Phases
 * - meta: called for each file
 * - raw: called for each file grouped with sidecar files. Eg. IMG_1234.jpg with sidecar IMG_1234.jpg.xmp
 * - file: called for each
 *
 * Files are grouped by common basename. E.g. `IMG_1234.jpg`, `IMG_1234.jpg.xmp` and `IMG_1234.json` share the basename `IMG_1234` and are grouped together
 * The main file is the largest file while the others are the side car files
 */
export type TExtractorPhase = 'meta' | 'raw' | 'file'

export type TExtractorEntry = TStorageEntry & {
  /**
   * Get local file path
   */
  getFile: Promise<string>
  /**
   * Get file content as readable stream
   */
  getStream: Promise<Readable>
};

export type TExtractorFunction = (entry: TExtractorEntry) => void

export type TExtractorTask = {
  /**
   * Extractor task to extract data from the entry
   */
  task: (entry: TExtractorEntry) => Promise<void>
  /**
   * Optional test to run task if result is true. If not provided the task is always executed
   */
  test?: (entry: TExtractorEntry) => boolean
  /**
   * Optional cleanup function
   */
  end?: () => Promise<void>
}

export type TExtractor = {
  name: string
  /**
   * Default phase is 'file'
   */
  phase?: TExtractorPhase
  create: (storage: TStorage) => Promise<TExtractorFunction | TExtractorTask | Transform>
  /**
   * Called when all extractor task have been completed
   */
  tearDown?: () => Promise<void>
}

export type TExtractorStream = {
  stream: Transform
  extractor: TExtractor;
  plugin: TPlugin;
}

export type TExtractorStreamTearDown = () => Promise<void>
