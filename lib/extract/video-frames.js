const path = require('path');
const through2 = require('through2');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');
const debug = require('debug')('extract:video:frame');

const getStoragePaths = require('../storage/storage-path');

function extractVideoFames(entry, src, storageDir, frameCount, filenamePattern, cb) {
  const t0 = Date.now();
  const {dir} = getStoragePaths(entry.sha1sum);

  let files = [];
  const command = ffmpeg(src);
  command.setFfmpegPath(ffmpegStatic.path);
  command.setFfprobePath(ffprobeStatic.path);  
  command
    .on('error', cb)
    .on('filenames', (filenames) => {
      files = filenames.map(name => path.join(dir, name));
    })
    .on('end', () => {
      files.forEach(file => entry.files.push(file));
      debug(`Extracted ${files.length} video frames from ${src} for ${entry} in ${Date.now() - t0}ms`);
      cb();
    })
    .screenshot({
      count: frameCount,
      folder: path.join(storageDir, dir),
      filename: filenamePattern
    });
}

function videoFrames(storageDir, frameCount) {

  function extractFrames(entry, cb) {  
    const {dir, prefix} = getStoragePaths(entry.sha1sum);
    const src = path.join(dir, `${prefix}-video-preview-720.mp4`);
    const filename = path.join(dir, `${prefix}-video-frame-001.jpg`);
  
    if (entry.files.indexOf(src) < 0) {
      debug(`Video preview file ${src} is missing for frame extraction of entry ${entry}. Skip it.`);
      return cb();
    } else if (entry.files.indexOf(filename) >= 0) {
      return cb();
    }

    extractVideoFames(entry, path.join(storageDir, src), storageDir, frameCount, `${prefix}-video-frame-%00i.jpg`, cb);
  }

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'video') {
      extractFrames(entry, (err) => {
        if (err) {
          debug(`Could not extract video frames from ${entry}: ${err}`);
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

module.exports = {videoFrames, extractVideoFames};