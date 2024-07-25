import path from 'path';
import { pipeline } from 'stream';

import Logger from '@home-gallery/logger'

const log = Logger('extractor');

import { fileFilter, promisify } from '@home-gallery/common';
import { readStreams } from '@home-gallery/index';

import { concurrent, each, filter, limit, purge, memoryIndicator, processIndicator, skip, flatten } from '@home-gallery/stream';
import { mapToStorageEntry } from './stream/map-storage-entry.js';
import { readAllEntryFiles } from './stream/read-all-entry-files.js';
import { groupByDir } from './stream/group-by-dir.js';
import { groupSidecars, ungroupSidecars } from './stream/group-sidecars.js';
import { groupByEntryFilesCacheKey } from './stream/group-entry-files-cache.js';
import { updateEntryFilesCache } from './stream/update-entry-files-cache.js';

import { createStorage } from './storage.js';

import {initExiftool, exif, endExiftool} from './extract/meta/exiftool.js';
import { ffprobe } from './extract/meta/ffprobe.js';
import { geoReverse } from './extract/meta/geo-reverse.js';

import { embeddedRawPreview } from './extract/image/embedded-raw-preview.js'
import { heicPreview } from './extract/image/heic-preview.js'
import { rawPreviewExif } from './extract/image/raw-preview-exif.js'
import { imagePreview } from './extract/image/image-preview.js';
import { createImageResizer } from './extract/image/image-resizer.js'
import { vibrant } from './extract/image/vibrant.js';
import { logPublicApiPrivacyHint, similarEmbeddings, objectDetection, faceDetection } from './extract/image/api-server.js';

import { getFfmpegPath, getFfprobePath } from './extract/utils/ffmpeg-path.js'

import { video } from './extract/video/video.js';
import { videoPoster } from './extract/video/video-poster.js';
import { createVideoFrameExtractor } from './extract/video/video-frame-extractor.js';

const fileFilterAsync = promisify(fileFilter);
const readStreamsAsync = promisify(readStreams)
const createImageResizerAsync = promisify(createImageResizer)

const byNumberDesc = (a, b) => b - a

const createExtractor = async (config) => {
  const exiftool = await initExiftool(config)
  const imageResizer = await createImageResizerAsync(config)
  const ffmpegPath = await getFfmpegPath(config)
  const ffprobePath = await getFfprobePath(config)
  const videoFrameExtractor = createVideoFrameExtractor(ffmpegPath, ffprobePath)
  const imagePreviewSizes = (config?.extractor?.image?.previewSizes || [1920, 1280, 800, 320, 128]).sort(byNumberDesc)

  return {
    ffprobePath,
    ffmpegPath,
    exiftool,
    imagePreviewSizes,
    imageResizer,
    videoFrameExtractor
  }

}

export const extract = async (options) => {
  const { config } = options
  const { files, journal, minChecksumDate } = config.fileIndex
  const entryStream = await readStreamsAsync(files, journal)

  const storage = createStorage(path.resolve(config.storage.dir))
  const extractor = await createExtractor(config)
  const fileFilterFn = await fileFilterAsync(config.extractor.excludes, config.extractor.excludeFromFile)

  const heic = await heicPreview(storage, extractor, config)

  const stream = {
    concurrent: 0,
    skip: 0,
    limit: 0,
    printEntry: false,
    ...config?.extractor?.stream,
    queued: 0,
    processing: 0,
    processed: 0
  }

  const { queueEntry, releaseEntry } = concurrent(stream.concurrent, stream.skip)

  return new Promise((resolve, reject) => {
    pipeline(
      entryStream,
      // only files with checksum. Exclude apple files starting with '._'
      filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
      filter(entry => !minChecksumDate || entry.sha1sumDate > minChecksumDate),
      filter(entry => fileFilterFn(entry.filename)),
      skip(stream.skip),
      limit(stream.limit),
      mapToStorageEntry,
      each(() => stream.queued++),
      queueEntry,
      each(() => stream.processing++),
      each(entry => stream.printEntry && log.info(`Processing entry #${stream.skip + stream.processed} ${entry}`)),
      // read existing files and meta data (json files)
      readAllEntryFiles(storage),

      exif(storage, extractor),
      ffprobe(storage, extractor),

      groupByDir(stream.concurrent),
      groupSidecars(),
      flatten(),
      // images grouped by sidecars in a dir ordered by file size
      heic,
      embeddedRawPreview(storage, extractor),
      ungroupSidecars(),
      rawPreviewExif(storage, extractor),

      // single ungrouped entries
      imagePreview(storage, extractor),
      videoPoster(storage, extractor),
      vibrant(storage, extractor),
      geoReverse(storage, config),
      logPublicApiPrivacyHint(config),
      similarEmbeddings(storage, extractor, config),
      objectDetection(storage, extractor, config),
      faceDetection(storage, extractor, config),
      video(storage, extractor, config),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      each(entry => stream.printEntry && log.debug(`Processed entry #${stream.skip + stream.processed} ${entry}`)),
      releaseEntry,
      each(() => stream.processed++),
      processIndicator({onTick: ({diff, lastTime}) => log.info(lastTime, `Processed ${stream.processed} entries (#${stream.skip + stream.processed}, +${diff}, processing ${stream.processing - stream.processed} and queued ${stream.queued - stream.processing} entries)`)}),

      groupByEntryFilesCacheKey(),
      updateEntryFilesCache(storage),
      processIndicator({name: 'entry dir cache'}),
      memoryIndicator({intervalMs: 30 * 1000}),
      purge(),
      err => {
        endExiftool(extractor.exiftool, () => {
          if (err) {
            log.error(err, `Could not process entries: ${err}`)
            reject(err)
          } else {
            resolve(stream.processed)
          }
        })
      }
    );
  });
}
