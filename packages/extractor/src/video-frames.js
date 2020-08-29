const path = require('path');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const ffmpeg = require('fluent-ffmpeg');
const debug = require('debug')('extract:video:frame');

const { getStoragePaths } = require('@home-gallery/storage');
const { toPipe, conditionalTask } = require('./task');

const videoPreviewSuffix = 'video-preview-720.mp4';
const firstFrameSuffix = 'video-frame-001.jpg';
const framePatternSuffix = 'video-frame-%00i.jpg';

function extractVideoFames(src, dir, filenamePattern, frameCount, cb) {
  const t0 = Date.now();

  let files = [];
  const command = ffmpeg(src);
  command.setFfmpegPath(ffmpegStatic);
  command.setFfprobePath(ffprobeStatic.path);  
  command
    .on('error', cb)
    .on('filenames', (filenames) => {
      files = filenames;
    })
    .on('end', () => {
      debug(`Extracted ${files.length} video frames from ${src} in ${Date.now() - t0}ms`);
      cb(null, files);
    })
    .screenshot({
      count: frameCount,
      folder: dir,
      filename: filenamePattern
    });
}

function videoFrames(storage, frameCount) {
  const test = entry => entry.type === 'video' && storage.hasEntryFile(entry, videoPreviewSuffix) && !storage.hasEntryFile(entry, firstFrameSuffix);

  const task = (entry, cb) => {
    const videoPreview = storage.getEntryFilename(entry, videoPreviewSuffix);
    const entryDir = storage.getEntryDirname(entry);
    const filenamePattern = storage.getEntryBasename(entry, framePatternSuffix);
    extractVideoFames(videoPreview, entryDir, filenamePattern, frameCount, (err, filenames) => {
      if (err) {
        debug(`Could not extract video frames from ${entry}: ${err}`);
      } else {
        filenames.forEach(filename => {
          storage.addEntryBasename(entry, filename);
        })
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = {videoFrames, extractVideoFames};