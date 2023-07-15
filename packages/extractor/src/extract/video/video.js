const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video');

const { toPipe, conditionalTask } = require('../../stream/task');

const videoSuffix = 'video-preview-720.mp4';

function convertVideo(storage, entry, ffprobePath, ffmpegPath, cb) {
  log.info(`Start video conversion of ${entry}`);

  const t0 = Date.now();
  const input = entry.src;
  const file = storage.getEntryFilename(entry, videoSuffix);
  const tmpFile = `${file}.tmp`;
  const intervalMs = 30*1000;
  let last = Date.now();
  const command = ffmpeg(input);
  command.setFfmpegPath(ffmpegPath);
  command.setFfprobePath(ffprobePath);

  command.ffprobe(function(err, data) {
    const width = data.streams[0].width;
    const height = data.streams[0].height;

    let sizePercentage = '50%';
    if (width <= 1920 && height <= 1080){
      sizePercentage = '100%';
    }

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
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(sizePercentage)
      .outputOptions([
        '-y',
        '-preset slow',
        '-tune film',
        '-profile:v high',
        '-level 4.0',
        '-maxrate 6000k',
        '-bufsize 12000k',
        '-movflags +faststart',
        '-b:a 128k',
        '-f mp4'
      ])
      .on('progress', progress => {
        const now = Date.now();
        if (now > last + intervalMs) {
          const optionalPercent = progress.percent ? ` is ${progress.percent?.toFixed()}%` : '';
          log.info(`Video conversion of ${entry} at ${progress.timemark}${optionalPercent} done`);
          last = now;
        }
      })
      .run();
  });
}

function video(storage, ffmpegPath, ffprobePath) {

  const test = entry => entry.type === 'video' && !storage.hasEntryFile(entry, videoSuffix);

  const task = (entry, cb) => {
    convertVideo(storage, entry, ffprobePath, ffmpegPath, (err) => {
      if (err) {
        log.error(err, `Video preview conversion of ${entry} failed: ${err}`);
      }
      cb();
    })
  }

  return toPipe(conditionalTask(test, task));
}

module.exports = video;
