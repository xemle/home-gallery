const { pipeline } = require('stream');

const log = require('@home-gallery/logger')('extractor');
const { readStreams } = require('@home-gallery/index');
const { concurrent, each, filter, limit, purge, memoryIndicator, processIndicator, skip, flatten } = require('@home-gallery/stream');
const mapToStorageEntry = require('./map-storage-entry');
const { createStorage } = require('./storage');

const readAllEntryFiles = require('./read-all-entry-files');
const exiftool = require('./exiftool');
const ffprobe = require('./ffprobe');
const { groupByDir } = require('./group-by-dir');
const { groupSidecars, ungroupSidecars } = require('./group-sidecars');
const embeddedRawPreview = require('./embedded-raw-preview')
const rawPreviewExif = require('./raw-preview-exif.js')
const { imagePreview } = require('./image-preview');
const vibrant = require('./vibrant');
const geoReverse = require('./geo-reverse');
const apiServerEntry = require('./api-server-entry');
const video = require('./video');
const videoPoster = require('./video-poster');
const {videoFrames} = require('./video-frames');
const groupByEntryFilesCacheKey = require('./group-entry-files-cache');
const { updateEntryFilesCache } = require('./update-entry-files-cache');

function extractData(config, cb) {
  const {indexFilenames, journal} = config;
  readStreams(indexFilenames, journal, (err, entryStream) => {
    if (err) {
      return cb(err);
    }
    const {storageDir, fileFilterFn, minChecksumDate, apiServerUrl, geoAddressLanguage, geoServerUrl} = config;
    const { queueEntry, releaseEntry } = concurrent(config.concurrent, config.skip)
    const storage = createStorage(storageDir);

    const imagePreviewSizes = [1920, 1280, 800, 320, 128];
    const videoFrameCount = 10;
    const similarityEmbeddingsPreviewSize = imagePreviewSizes[2];

    const stats = {
      queued: 0,
      processing: 0,
      processed: 0
    }
    pipeline(
      entryStream,
      // only files with checksum. Exclude apple files starting with '._'
      filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
      filter(entry => !minChecksumDate || entry.sha1sumDate > minChecksumDate),
      filter(entry => fileFilterFn(entry.filename)),
      skip(config.skip),
      limit(config.limit),
      mapToStorageEntry,
      each(() => stats.queued++),
      queueEntry,
      each(() => stats.processing++),
      each(entry => config.printEntry && log.info(`Processing entry #${config.skip + stats.processed} ${entry}`)),
      // read existing files and meta data (json files)
      readAllEntryFiles(storage),

      exiftool(storage),
      ffprobe(storage),

      groupByDir(),
      groupSidecars(),
      flatten(),
      // images grouped by sidecars in a dir ordered by file size
      embeddedRawPreview(storage),
      ungroupSidecars(),
      rawPreviewExif(storage),

      // single ungrouped entries
      imagePreview(storage, imagePreviewSizes),
      videoPoster(storage, imagePreviewSizes),
      vibrant(storage),
      geoReverse(storage, {geoAddressLanguage, geoServerUrl}),
      apiServerEntry(storage, {
        name: 'similarity embeddings',
        apiServerUrl,
        apiPath: '/embeddings',
        imageSuffix: `image-preview-${similarityEmbeddingsPreviewSize}.jpg`,
        entrySuffix: 'similarity-embeddings.json',
        concurrent: 5,
        timeout: 30000,
      }),
      apiServerEntry(storage, {
        name: 'object detection',
        apiServerUrl,
        apiPath: '/objects',
        imageSuffix: `image-preview-${similarityEmbeddingsPreviewSize}.jpg`,
        entrySuffix: 'objects.json',
        concurrent: 5,
        timeout: 30000,
      }),
      apiServerEntry(storage, {
        name: 'face detection',
        apiServerUrl,
        apiPath: '/faces',
        imageSuffix: `image-preview-${similarityEmbeddingsPreviewSize}.jpg`,
        entrySuffix: 'faces.json',
        concurrent: 2,
        timeout: 30000,
      }),
      video(storage),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      releaseEntry,
      each(() => stats.processed++),
      processIndicator({onTick: ({diff, lastTime}) => log.info(lastTime, `Processed ${stats.processed} entries (#${config.skip + stats.processed}, +${diff}, processing ${stats.processing - stats.processed} and queued ${stats.queued - stats.processing} entries)`)}),

      groupByEntryFilesCacheKey(),
      updateEntryFilesCache(storage),
      processIndicator({name: 'entry dir cache'}),
      memoryIndicator({intervalMs: 30 * 1000}),
      purge(),
      (err) => {
        if (err) {
          return cb(`Could not process entries: ${err}`)
        }
        cb(null, stats.processed)
      }
    );
  });
}

module.exports = extractData;
