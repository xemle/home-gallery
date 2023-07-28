const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video');

const { toPipe, conditionalTask } = require('../../stream/task');

const { getVideoStream, isVideoRotated, fixRotatedScale } = require('./video-utils')

function getFfmpegOptions(entry, options) {
  const rotated = isVideoRotated(getVideoStream(entry))

  const ffmpegOptions = [
    '-c:v libx264',
    '-c:a aac',
    '-r 30', // frame rate
    `-vf scale=-2:\'min(${options.size || 720},ih)\',format=yuv420p`, // Scale to 720p without upscaling
    '-preset slow',
    '-tune film',
    '-profile:v baseline',
    '-level 3.0',
    '-maxrate 4000k',
    '-bufsize 8000k',
    '-movflags +faststart',
    '-b:a 128k',
    '-f mp4'
  ].map(fixRotatedScale(rotated))
  return ffmpegOptions
}

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
    .outputOptions(getFfmpegOptions(entry, options))
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
  const options = extractor?.video

  const videoSuffix = `video-preview-${options.size || 720}.mp4`;

  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoSuffix);

  const task = (entry, cb) => {
    convertVideo(storage, entry, {...options, videoSuffix}, (err) => {
      if (err) {
        log.error(err, `Video preview conversion of ${entry} failed: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = {
  video,
  getFfmpegOptions
};
