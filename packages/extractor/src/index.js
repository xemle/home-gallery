const { pipeline } = require('stream');

const { readStreams } = require('@home-gallery/index');
const { filter, toList, sort, each, flatten, map, processIndicator } = require('@home-gallery/stream');
const mapToStorageEntry = require('./map-storage-entry');
const { readMeta } = require('@home-gallery/storage');
const { createStorage } = require('./storage');

const exiftool = require('./exiftool');
const ffprobe = require('./ffprobe');
const { imagePreview } = require('./image-preview');
const vibrant = require('./vibrant');
const phash = require('./phash');
const geoReverse = require('./geo-reverse');
const similarityEmbeddings = require('./similarity-embeddings');
const video = require('./video');
const videoPoster = require('./video-poster');
const {videoFrames} = require('./video-frames');
const groupByMetaCache = require('./group-meta-cache');
const { writeMetaCache } = require('./write-meta-cache');

function extractData(indexFilenames, storageDir, fileFilterFn, minChecksumDate, cb) {
  readStreams(indexFilenames, (err, entryStream) => {
    if (err) {
      return cb(err);
    }

    const storage = createStorage(storageDir);

    const imagePreviewSizes = [1920, 1280, 800, 320, 128];
    const videoFrameCount = 10;
    const phashPreviewSize = imagePreviewSizes[2];
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
      readMeta(storageDir),

      exiftool(storage),
      ffprobe(storage),
      imagePreview(storage, imagePreviewSizes),
      videoPoster(storage, imagePreviewSizes),
      vibrant(storage),
      phash(storageDir, `image-preview-${phashPreviewSize}`),
      geoReverse(storage, ['de', 'en']),
      similarityEmbeddings(storage, `image-preview-${similarityEmbeddingsPreviewSize}.jpg`, 5),
      video(storage),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      processIndicator({totalFn: () => total}),

      groupByMetaCache(),
      writeMetaCache(storageDir).on('finish', () => cb(null, total)),
      (err) => {
        if (err) {
          return cb(`Could not process entries: ${err}`)
        }
      }
    );
  });
}

module.exports = extractData;
