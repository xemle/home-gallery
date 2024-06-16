import ffmpeg from 'fluent-ffmpeg';

import Logger from '@home-gallery/logger'

const log = Logger('extractor.video.frameExtractor');

export const createVideoFrameExtractor = (ffmpegPath, ffprobePath) => {
  return (src, dir, filenamePattern, frameCount, cb) => {
    const t0 = Date.now();

    let files = [];
    const timemarks = new Array(frameCount).fill(0).map((_, i) => `${(100*i/frameCount).toFixed(1)}%`)
    const command = ffmpeg(src);
    command.setFfmpegPath(ffmpegPath);
    command.setFfprobePath(ffprobePath);
    command
      .on('error', cb)
      .on('filenames', (filenames) => {
        files = filenames;
      })
      .on('end', () => {
        log.debug(t0, `Extracted ${files.length} video frames from ${src}`);
        cb(null, files);
      })
      .screenshot({
        timemarks,
        folder: dir,
        filename: filenamePattern
      });
  }
}
