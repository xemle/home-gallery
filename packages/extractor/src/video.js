const fs = require('fs');
const path = require('path');
const through2 = require('through2');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');

const debug = require('debug')('extract:video');

const { getStoragePaths } = require('@home-gallery/storage');
const { toPipe, conditionalTask } = require('./task');

function convertVideo(storageDir, entry, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const filename = path.join(dir, `${prefix}-video-preview-720.mp4`);

  if (entry.files.indexOf(filename) >= 0) {
    return cb();
  }

  debug(`Start video conversion of ${entry}`);

  const t0 = Date.now();
  const input = entry.src;
  const tmpFile = path.join(storageDir, `${filename}.tmp`);
  const file = path.join(storageDir, filename);
  const command = ffmpeg(input);
  command.setFfmpegPath(ffmpegStatic);
  command.setFfprobePath(ffprobeStatic.path);  
  command
    .on('error', cb)
    .on('end', () => {
      fs.rename(tmpFile, file, (err) => {
        if (err) {
          return cb(`Failed to rename file to ${filename} for ${entry}`);
        }
        entry.files.push(filename);
        debug(`Video conversion of ${entry} done in ${Date.now() - t0}ms`);
        cb();
      })
    })
    .output(tmpFile)
    .videoCodec('libx264')
    .audioCodec('aac')
    .outputOptions([
      '-r 30', // frame rate
      '-vf scale=-2:\'min(720,ih)\',format=yuv420p', // Scale to 720p without upscaling
      '-preset slow',
      '-tune film',
      '-profile:v baseline',
      '-level 3.0',
      '-maxrate 4000k',
      '-bufsize 8000k',
      '-movflags +faststart',
      '-b:a 128k',
      '-f mp4'
    ])
    .run();
}

function video(storageDir) {
  const test = entry => entry.type === 'video';

  const task = (entry, cb) => {
    convertVideo(storageDir, entry, (err) => {
      if (err) {
        debug(`Video preview conversion of ${entry} failed: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = video;
