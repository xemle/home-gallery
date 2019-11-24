const path = require('path');
const through2 = require('through2');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');
const debug = require('debug')('video:frame');

const getStoragePaths = require('./storage-path');
const { resizeImage } = require('./preview-image');

function videoFrames(storageDir, frameCount, previewImageSizes) {

  function extractFrames(entry, cb) {
    const src = entry.src;
  
    const {dir, prefix} = getStoragePaths(entry.sha1sum);
    const filename = path.join(dir, `${prefix}-video-frame-001.jpg`);
  
    if (entry.files.indexOf(filename) >= 0) {
      return cb();
    }
  
    let thumbFilenames = [];
    const command = ffmpeg(src);
    command.setFfmpegPath(ffmpegStatic.path);
    command.setFfprobePath(ffprobeStatic.path);  
    command
      .on('error', cb)
      .on('filenames', (filenames) => {
        thumbFilenames = filenames.map(name => path.join(dir, name));
      })
      .on('end', () => {
        thumbFilenames.forEach(file => entry.files.push(file));
        debug(`Extracted ${thumbFilenames.length} video frames from ${entry.filename}`);
        resizeImage(storageDir, entry, path.join(storageDir, thumbFilenames[0]), previewImageSizes, cb);
      })
      .screenshot({
        count: frameCount,
        folder: path.join(storageDir, dir),
        filename: `${prefix}-video-frame-%00i.jpg`
      });
  }

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'video') {
      extractFrames(entry, (err) => {
        if (err) {
          debug(`Could not extract video frames from ${entry.filename}: ${err}`);
        }
        that.push(entry);
        cb();
      })
    } else {
      this.push(entry);
      cb();
    }

  });
}

module.exports = videoFrames;