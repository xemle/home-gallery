const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video.frames');

const { getStoragePaths } = require('@home-gallery/storage');
const { toPipe, conditionalTask } = require('./task');

const videoPreviewSuffix = 'video-preview-720.mp4';
const firstFrameSuffix = 'video-frame-001.jpg';
const framePatternSuffix = 'video-frame-%00i.jpg';

function extractVideoFames(src, dir, filenamePattern, frameCount, cb) {
  const t0 = Date.now();

  let files = [];
  const command = ffmpeg(src);
  command.setFfmpegPath(ffmpegPath);
  command.setFfprobePath(ffprobePath);
  command
    .on('error', cb)
    .on('filenames', (filenames) => {
      files = filenames;
    })
    .on('end', () => {
      log.info(t0, `Extracted ${files.length} video frames from ${src}`);
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
        log.error(`Could not extract video frames from ${entry}: ${err}`);
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