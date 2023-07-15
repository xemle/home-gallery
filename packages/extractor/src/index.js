const { pipeline } = require('stream');

const log = require('@home-gallery/logger')('extractor');

const { promisify } = require('@home-gallery/common');
const { readStreams } = require('@home-gallery/index');

const { concurrent, each, filter, limit, purge, memoryIndicator, processIndicator, skip, flatten } = require('@home-gallery/stream');
const mapToStorageEntry = require('./stream/map-storage-entry');
const readAllEntryFiles = require('./stream/read-all-entry-files');
const { groupByDir } = require('./stream/group-by-dir');
const { groupSidecars, ungroupSidecars } = require('./stream/group-sidecars');
const groupByEntryFilesCacheKey = require('./stream/group-entry-files-cache');
const { updateEntryFilesCache } = require('./stream/update-entry-files-cache');

const { createStorage } = require('./storage');

const {initExiftool, exif, endExiftool} = require('./extract/meta/exiftool');
const ffprobe = require('./extract/meta/ffprobe');
const geoReverse = require('./extract/meta/geo-reverse');

const embeddedRawPreview = require('./extract/image/embedded-raw-preview')
const heicPreview = require('./extract/image/heic-preview')
const rawPreviewExif = require('./extract/image/raw-preview-exif.js')
const { imagePreview } = require('./extract/image/image-preview');
const { createImageResizer } = require('./extract/image/image-resizer')
const vibrant = require('./extract/image/vibrant');
const { similarEmbeddings, objectDetection, faceDetection } = require('./extract/image/api-server');

const { getFfmpegPaths } = require('./extract/utils/ffmpeg-path')

const video = require('./extract/video/video');
const videoPoster = require('./extract/video/video-poster');
const { createVideoFrameExtractor } = require('./extract/video/video-frame-extractor');

const readStreamsAsync = promisify(readStreams)
const createImageResizerAsync = promisify(createImageResizer)

const byNumberDesc = (a, b) => b - a

const extractData = async (options) => {
  const { config } = options
  const { indexFilenames, journal, fileFilterFn, minChecksumDate } = config.sources
  const entryStream = await readStreamsAsync(indexFilenames, journal)

  const { extractor } = config
  const { queueEntry, releaseEntry } = concurrent(extractor.stream.concurrent, extractor.stream.skip)

  const exiftool = initExiftool(extractor)
  const [ffmpegPath, ffprobePath] = getFfmpegPaths(extractor)
  const imageResizer = await createImageResizerAsync(extractor)
  const videoFrameExtractor = createVideoFrameExtractor(ffmpegPath, ffprobePath)
  const storage = createStorage(config.storage.dir);

  const imagePreviewSizes = (extractor.image?.previewSizes || [1920, 1280, 800, 320, 128]).sort(byNumberDesc);
  const videoFrameCount = 10;
  const apiServerImagePreviewSizes = imagePreviewSizes.filter(size => size <= 800);

  const stats = {
    queued: 0,
    processing: 0,
    processed: 0
  }

  return new Promise((resolve, reject) => {
    pipeline(
      entryStream,
      // only files with checksum. Exclude apple files starting with '._'
      filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
      filter(entry => !minChecksumDate || entry.sha1sumDate > minChecksumDate),
      filter(entry => fileFilterFn(entry.filename)),
      skip(extractor.stream.skip),
      limit(extractor.stream.limit),
      mapToStorageEntry,
      each(() => stats.queued++),
      queueEntry,
      each(() => stats.processing++),
      each(entry => extractor.stream.printEntry && log.info(`Processing entry #${extractor.stream.skip + stats.processed} ${entry}`)),
      // read existing files and meta data (json files)
      readAllEntryFiles(storage),

      exif(storage, {exiftool}),
      ffprobe(storage, ffprobePath),

      groupByDir(),
      groupSidecars(),
      flatten(),
      // images grouped by sidecars in a dir ordered by file size
      heicPreview(storage, {...options, imageResizer}),
      embeddedRawPreview(storage, {exiftool}),
      ungroupSidecars(),
      rawPreviewExif(storage, {exiftool}),

      // single ungrouped entries
      imagePreview(storage, {imageResizer, previewSizes: imagePreviewSizes} ),
      videoPoster(storage, {imageResizer, videoFrameExtractor, imagePreviewSizes}),
      vibrant(storage, imagePreviewSizes),
      geoReverse(storage, {url: extractor.geoReverse?.url, addressLanguage: extractor.geoReverse?.addressLanguage}),
      similarEmbeddings(storage, extractor.apiServer.url, apiServerImagePreviewSizes, extractor.apiServer.timeout, extractor.apiServer.concurrent),
      objectDetection(storage, extractor.apiServer.url, apiServerImagePreviewSizes, extractor.apiServer.timeout, extractor.apiServer.concurrent),
      faceDetection(storage, extractor.apiServer.url, apiServerImagePreviewSizes, extractor.apiServer.timeout, extractor.apiServer.concurrent),
      video(storage, ffmpegPath, ffprobePath),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      releaseEntry,
      each(() => stats.processed++),
      processIndicator({onTick: ({diff, lastTime}) => log.info(lastTime, `Processed ${stats.processed} entries (#${extractor.stream.skip + stats.processed}, +${diff}, processing ${stats.processing - stats.processed} and queued ${stats.queued - stats.processing} entries)`)}),

      groupByEntryFilesCacheKey(),
      updateEntryFilesCache(storage),
      processIndicator({name: 'entry dir cache'}),
      memoryIndicator({intervalMs: 30 * 1000}),
      purge(),
      err => {
        endExiftool(exiftool, () => {
          if (err) {
            log.error(err, `Could not process entries: ${err}`)
            reject(err)
          } else {
            resolve(stats.processed)
          }
        })
      }
    );
  });
}

module.exports = extractData;
