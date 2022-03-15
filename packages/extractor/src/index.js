const { pipeline } = require('stream');

const log = require('@home-gallery/logger')('extractor');
const { readStreams } = require('@home-gallery/index');
const { concurrent, each, filter, limit, purge, memoryIndicator, processIndicator, skip, flatten } = require('@home-gallery/stream');
const mapToStorageEntry = require('./map-storage-entry');
const { createStorage } = require('./storage');

const readAllEntryFiles = require('./read-all-entry-files');
const {initExiftool, exif, endExiftool} = require('./exiftool');
const ffprobe = require('./ffprobe');
const { groupByDir } = require('./group-by-dir');
const { groupSidecars, ungroupSidecars } = require('./group-sidecars');
const embeddedRawPreview = require('./embedded-raw-preview')
const heicPreview = require('./heic-preview')
const rawPreviewExif = require('./raw-preview-exif.js')
const { imagePreview } = require('./image-preview');
const { createImageResizer } = require('./image-resizer')
const vibrant = require('./vibrant');
const geoReverse = require('./geo-reverse');
const { similarEmbeddings, objectDetection, faceDetection } = require('./api-server');
const { getFfmpegPaths } = require('./ffmpeg-path')
const video = require('./video');
const videoPoster = require('./video-poster');
const { createVideoFrameExtractor } = require('./video-frame-extractor');
const groupByEntryFilesCacheKey = require('./group-entry-files-cache');
const { updateEntryFilesCache } = require('./update-entry-files-cache');
const { promisify, callbackify } = require('@home-gallery/common');

const readStreamsAsync = promisify(readStreams)
const createImageResizerAsync = promisify(createImageResizer)

const extractData = async (options) => {
  const {indexFilenames, journal} = options
  const entryStream = await readStreamsAsync(indexFilenames, journal)
  const {storageDir, fileFilterFn, minChecksumDate, apiServerUrl, geoAddressLanguage, geoServerUrl} = options;
  const { queueEntry, releaseEntry } = concurrent(options.concurrent, options.skip)

  const exiftool = initExiftool(options)
  const [ffmpegPath, ffprobePath] = getFfmpegPaths(options)
  const imageResizer = await createImageResizerAsync(options)
  const videoFrameExtractor = createVideoFrameExtractor(ffmpegPath, ffprobePath)
  const storage = createStorage(storageDir);

  const imagePreviewSizes = [1920, 1280, 800, 320, 128];
  const videoFrameCount = 10;
  const apiServerImagePreviewSize = imagePreviewSizes[2];

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
      skip(options.skip),
      limit(options.limit),
      mapToStorageEntry,
      each(() => stats.queued++),
      queueEntry,
      each(() => stats.processing++),
      each(entry => options.printEntry && log.info(`Processing entry #${options.skip + stats.processed} ${entry}`)),
      // read existing files and meta data (json files)
      readAllEntryFiles(storage),

      exif(storage, {exiftool}),
      ffprobe(storage, options),

      groupByDir(),
      groupSidecars(),
      flatten(),
      // images grouped by sidecars in a dir ordered by file size
      heicPreview(storage, {options, imageResizer}),
      embeddedRawPreview(storage, {exiftool}),
      ungroupSidecars(),
      rawPreviewExif(storage, {exiftool}),

      // single ungrouped entries
      imagePreview(storage, {imageResizer, imagePreviewSizes} ),
      videoPoster(storage, {imageResizer, videoFrameExtractor, imagePreviewSizes}),
      vibrant(storage),
      geoReverse(storage, {geoAddressLanguage, geoServerUrl}),
      similarEmbeddings(storage, apiServerUrl, apiServerImagePreviewSize),
      objectDetection(storage, apiServerUrl, apiServerImagePreviewSize),
      faceDetection(storage, apiServerUrl, apiServerImagePreviewSize),
      video(storage, ffmpegPath, ffprobePath),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      releaseEntry,
      each(() => stats.processed++),
      processIndicator({onTick: ({diff, lastTime}) => log.info(lastTime, `Processed ${stats.processed} entries (#${options.skip + stats.processed}, +${diff}, processing ${stats.processing - stats.processed} and queued ${stats.queued - stats.processing} entries)`)}),

      groupByEntryFilesCacheKey(),
      updateEntryFilesCache(storage),
      processIndicator({name: 'entry dir cache'}),
      memoryIndicator({intervalMs: 30 * 1000}),
      purge(),
      err => {
        endExiftool(exiftool, () => {
          if (err) {
            log.err(err, `Could not process entries: ${err}`)
            reject(err)
          } else {
            resolve(stats.processed)
          }
        })
      }
    );
  });
}

module.exports = callbackify(extractData);
