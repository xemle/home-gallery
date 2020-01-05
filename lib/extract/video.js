const path = require('path');
const through2 = require('through2');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');

const debug = require('debug')('extract:video');

const getStoragePaths = require('./storage-path');

function convertVideo(storageDir, entry, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const filename = path.join(dir, `${prefix}-video-preview-720.mp4`);

  if (entry.files.indexOf(filename) >= 0) {
    return cb();
  }

  const t0 = Date.now();
  const input = entry.src;
  const output = path.join(storageDir, filename);
  const command = ffmpeg(input);
  command.setFfmpegPath(ffmpegStatic.path);
  command.setFfprobePath(ffprobeStatic.path);  
  command
    .on('error', cb)
    .on('end', () => {
      entry.files.push(filename);
      debug(`Calculated video preview from ${input} for ${entry} in ${Date.now() - t0}ms`);
      cb();
    })
    .output(output)
    .audioCodec('aac')
    .videoCodec('libx264')
    .frames(30)
    .size('720x?')
    .keepDAR()
    .outputOptions([
      '-preset veryfast',
      '-tune film',
      '-profile:v baseline',
      '-level 3.0',
      '-maxrate 600k',
      '-bufsize 1200k',
      '-movflags +faststart'
    ])
    .run();
}

function video(storageDir) {

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'video') {
      convertVideo(storageDir, entry, (err) => {
        if (err) {
          debug(`Could not extract exif of ${entry.filename}: ${err}`);
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

module.exports = video;
