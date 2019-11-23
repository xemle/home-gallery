const processIndicator = require('../stream/process-indicator');
const readStream = require('../index/read-stream');
const filter = require('../stream/filter');
const mapToStorageEntry = require('./map-storage-entry');
const readMeta = require('./read-meta');

const exiftool = require('./exiftool');
const ffprobe = require('./ffprobe');
const { previewImage } = require('./preview-image');
const video = require('./video');
const videoFrames = require('./video-frames');

function extractData(indexFilename, storageDir, cb) {
  readStream(indexFilename, (err, entryStream) => {
    if (err) {
      return cb(err);
    }

    previewImageSizes = [1920, 1280, 800, 320, 128];
    videoFrameCount = 10;

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
      .pipe(previewImage(storageDir, previewImageSizes))
      .pipe(video(storageDir))
      .pipe(videoFrames(storageDir, videoFrameCount, previewImageSizes))

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