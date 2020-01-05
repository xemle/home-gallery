const mergeStream = require('merge-stream');
const processIndicator = require('../stream/process-indicator');
const readStream = require('../index/read-stream');
const filter = require('../stream/filter');
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

function getEntryStream(indexFilenames, cb) {
  const merged = mergeStream();
  let i = 0;

  function next() {
    if (i === indexFilenames.length) {
      return cb(null, merged);
    }
    const indexFilename = indexFilenames[i++];
    readStream(indexFilename, (err, entryStream) => {
      if (err) {
        debug(`Could not read file index stream of ${indexFilename}. Skip it`);
        return next();
      }
      merged.add(entryStream);
      next();
    });
  }

  next();
}

function extractData(indexFilenames, storageDir, cb) {
  getEntryStream(indexFilenames, (err, entryStream) => {
    if (err) {
      return cb(err);
    }

    const imagePreviewSizes = [1920, 1280, 800, 320, 128];
    const videoFrameCount = 10;

    let count = 0;
    entryStream
      // only files with checksum. Exclude apple files starting with '._'
      .pipe(filter(entry => entry.fileType === 'f' && entry.sha1sum && !entry.filename.match(/^\._/)))
      .pipe(mapToStorageEntry)
      // only local files supported
      .pipe(filter(entry => entry.src))
      // read existing files and meta data (json files)
      .pipe(readMeta(storageDir))

      .pipe(exiftool(storageDir))
      .pipe(ffprobe(storageDir))
      .pipe(imagePreview(storageDir, imagePreviewSizes))
      .pipe(videoPoster(storageDir, imagePreviewSizes))
      .pipe(vibrant(storageDir))
      .pipe(phash(storageDir, `image-preview-${imagePreviewSizes[1]}`))
      .pipe(geoReverse(storageDir))
      .pipe(video(storageDir))
      //.pipe(videoFrames(storageDir, videoFrameCount))

      .pipe(processIndicator({}))
      .on('data', () => {
        count++;
      })
      .on('end', () => {
        cb(null, count);
      })
      .on('error', cb);

  });
}

module.exports = extractData;