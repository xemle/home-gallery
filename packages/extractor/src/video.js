const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video');

const { toPipe, conditionalTask } = require('./task');

const videoSuffix = 'video-preview-720.mp4';

function convertVideo(storage, entry, cb) {
  log.info(`Start video conversion of ${entry}`);

  const t0 = Date.now();
  const input = entry.src;
  const file = storage.getEntryFilename(entry, videoSuffix);
  const tmpFile = `${file}.tmp`;
  const command = ffmpeg(input);
  const intervalMs = 30*1000;
  let last = Date.now();
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
        log.info(t0, `Video conversion of ${entry} done`);
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
    .on('progress', progress => {
      const now = Date.now();
      if (now > last + intervalMs) {
        log.debug(`Video conversion of ${entry} at ${progress.timemark} is ${progress.percent.toFixed()}% done`);
        last = now;
      }
    })
    .run();
}

function video(storage) {
  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoSuffix);

  const task = (entry, cb) => {
    convertVideo(storage, entry, (err) => {
      if (err) {
        log.error(`Video preview conversion of ${entry} failed: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = video;
