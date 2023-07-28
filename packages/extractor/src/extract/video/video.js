const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video');

const { toPipe, conditionalTask } = require('../../stream/task');

const { getVideoOptions, getFfmpegArgs } = require('./video-utils')

function convertVideo(storage, entry, options, cb) {
  log.info(`Start video conversion of ${entry}`);

  const {ffprobePath, ffmpegPath, videoSuffix} = options
  const t0 = Date.now();
  const input = entry.src;
  const file = storage.getEntryFilename(entry, videoSuffix);
  const tmpFile = `${file}.tmp`;
  const intervalMs = 30*1000;
  let last = Date.now();
  const command = ffmpeg(input);
  command.setFfmpegPath(ffmpegPath);
  command.setFfprobePath(ffprobePath);
  command
    .on('error', cb)
    .on('end', () => {
      fs.rename(tmpFile, file, (err) => {
        if (err) {
          log.error(err, `Could not rename file ${tmpFile} to ${file} for ${entry}`)
          return cb();
        }
        storage.addEntryFilename(entry, videoSuffix);
        log.info(t0, `Video conversion of ${entry} done`);
        cb();
      })
    })
    .output(tmpFile)
    .outputOptions('-y')
    .outputOptions(getFfmpegArgs(entry, options))
    .on('start', commandLine => log.debug(`Start video conversion via ffmpeg command: ${commandLine}`))
    .on('progress', progress => {
      const now = Date.now();
      if (now > last + intervalMs) {
        const optionalPercent = progress.percent ? ` is ${progress.percent?.toFixed()}%` : '';
        log.info(`Video conversion of ${entry} at ${progress.timemark}${optionalPercent} done`);
        last = now;
      }
    })
    .run();
}

function video(storage, extractor) {
  const videoOptions = getVideoOptions(extractor)

  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoOptions.videoSuffix);

  const task = (entry, cb) => {
    convertVideo(storage, entry, videoOptions, (err) => {
      if (err) {
        log.error(err, `Video preview conversion of ${entry} failed: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = {
  video
};
