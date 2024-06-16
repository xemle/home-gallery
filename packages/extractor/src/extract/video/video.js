import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

import Logger from '@home-gallery/logger'

const log = Logger('extractor.video');

import { toPipe, conditionalTask } from '../../stream/task.js';

import { getVideoOptions, getFfmpegArgs } from './video-utils.js'

function convertVideo(storage, entry, options, cb) {
  log.info(`Start video conversion of ${entry}`);

  const {ffprobePath, ffmpegPath, videoSuffix} = options
  const t0 = Date.now();
  const file = storage.getEntryFilename(entry, videoSuffix);
  const tmpFile = `${file}.tmp`;
  const intervalMs = 30*1000;
  let last = Date.now();
  const ffmpegArgs = getFfmpegArgs(entry, options)
  const command = ffmpeg(entry.src);
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
    .addOptions(ffmpegArgs)
    .output(tmpFile)
    .on('start', commandLine => log.debug({ffmpegArgs}, `Start video conversion via ffmpeg command: ${commandLine}`))
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

export function video(storage, extractor, config) {
  const videoOptions = getVideoOptions(extractor, config)

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
