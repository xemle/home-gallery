const { pipeline } = require('stream');

const { readStreams } = require('@home-gallery/index');
const { filter, toList, sort, each, flatten, purge, processIndicator } = require('@home-gallery/stream');
const mapToStorageEntry = require('./map-storage-entry');
const { createStorage } = require('./storage');

const readAllEntryFiles = require('./read-all-entry-files');
const exiftool = require('./exiftool');
const ffprobe = require('./ffprobe');
const { imagePreview } = require('./image-preview');
const vibrant = require('./vibrant');
const geoReverse = require('./geo-reverse');
const similarityEmbeddings = require('./similarity-embeddings');
const video = require('./video');
const videoPoster = require('./video-poster');
const {videoFrames} = require('./video-frames');
const groupByEntryFilesCacheKey = require('./group-entry-files-cache');
const { updateEntryFilesCache } = require('./update-entry-files-cache');

function extractData(config, cb) {
  const {indexFilenames} = config;
  readStreams(indexFilenames, (err, entryStream) => {
    if (err) {
      return cb(err);
    }
    const {storageDir, fileFilterFn, minChecksumDate, apiServerUrl} = config;
    const storage = createStorage(storageDir);

    const imagePreviewSizes = [1920, 1280, 800, 320, 128];
    const videoFrameCount = 10;
    const similarityEmbeddingsPreviewSize = imagePreviewSizes[2];

    let total = 0;
    pipeline(
      entryStream,
      // only files with checksum. Exclude apple files starting with '._'
      filter(entry => entry.fileType === 'f' && entry.sha1sum && entry.size > 0),
      filter(entry => !minChecksumDate || entry.sha1sumDate > minChecksumDate),
      filter(entry => fileFilterFn(entry.filename)),
      // Sort by index and filename
      toList(),
      sort(entry => `${entry.indexName}:${entry.filename}`, true),
      each(entry => { total = entry.length }),
      flatten(),
      mapToStorageEntry,
      // read existing files and meta data (json files)
      readAllEntryFiles(storage),

      exiftool(storage),
      ffprobe(storage),
      imagePreview(storage, imagePreviewSizes),
      videoPoster(storage, imagePreviewSizes),
      vibrant(storage),
      geoReverse(storage, ['de', 'en']),
      similarityEmbeddings(storage, {
        imageSuffix: `image-preview-${similarityEmbeddingsPreviewSize}.jpg`,
        concurrent: 5,
        timeout: 30000,
        apiServerUrl,
      }),
      video(storage),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      processIndicator({totalFn: () => total}),

      groupByEntryFilesCacheKey(),
      updateEntryFilesCache(storage),
      purge(),
      (err) => {
        if (err) {
          return cb(`Could not process entries: ${err}`)
        }
        cb(null, total)
      }
    );
  });
}

module.exports = extractData;
