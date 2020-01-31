const { pipeline } = require('stream');

const processIndicator = require('../stream/process-indicator');
const { readStreams } = require('../index/read-stream');
const filter = require('../stream/filter');
const toList = require('../stream/to-list');
const sort = require('../stream/sort');
const each = require('../stream/each');
const flatten = require('../stream/flatten');
const mapToStorageEntry = require('./map-storage-entry');
const readMeta = require('./read-meta');

const exiftool = require('./exiftool');
const ffprobe = require('./ffprobe');
const { imagePreview } = require('./image-preview');
const vibrant = require('./vibrant');
const phash = require('./phash');
const geoReverse = require('./geo-reverse');
const video = require('./video');
const videoPoster = require('./video-poster');
const {videoFrames} = require('./video-frames');

function extractData(indexFilenames, storageDir, fileFilterFn, minChecksumDate, cb) {
  readStreams(indexFilenames, (err, entryStream) => {
    if (err) {
      return cb(err);
    }

    const imagePreviewSizes = [1920, 1280, 800, 320, 128];
    const videoFrameCount = 10;

    let count = 0;
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

      exiftool(storageDir),
      ffprobe(storageDir),
      imagePreview(storageDir, imagePreviewSizes),
      videoPoster(storageDir, imagePreviewSizes),
      vibrant(storageDir),
      phash(storageDir, `image-preview-${imagePreviewSizes[1]}`),
      geoReverse(storageDir),
      video(storageDir),
      //.pipe(videoFrames(storageDir, videoFrameCount))

      processIndicator({totalFn: () => total}),
      each(() => { count++; }),
      (err) => {
        if (err) {
          return cb(`Could not process entries: ${err}`)
        }
        cb(null, count)
      }
    );
  });
}

module.exports = extractData;
