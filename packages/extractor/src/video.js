const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const debug = require('debug')('extract:video');

const { toPipe, conditionalTask } = require('./task');

const videoSuffix = 'video-preview-720.mp4';

function convertVideo(storage, entry, cb) {
  debug(`Start video conversion of ${entry}`);

  const t0 = Date.now();
  const input = entry.src;
  const file = storage.getEntryFilename(entry, videoSuffix);
  const tmpFile = `${file}.tmp`;
  const command = ffmpeg(input);
  command.setFfmpegPath(ffmpegPath);
  command.setFfprobePath(ffprobePath);
  command
    .on('error', cb)
    .on('end', () => {
      fs.rename(tmpFile, file, (err) => {
        if (err) {
          return cb(`Failed to rename file to ${filename} for ${entry}`);
        }
        storage.addEntryFilename(entry, videoSuffix);
        debug(`Video conversion of ${entry} done in ${Date.now() - t0}ms`);
        cb();
      })
    })
    .output(tmpFile)
    .videoCodec('libx264')
    .audioCodec('aac')
    .outputOptions([
      '-y',
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

function video(storage) {
  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoSuffix);

  const task = (entry, cb) => {
    convertVideo(storage, entry, (err) => {
      if (err) {
        debug(`Video preview conversion of ${entry} failed: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = video;
