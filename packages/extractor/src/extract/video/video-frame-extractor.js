const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video.frameExtractor');

const createVideoFrameExtractor = (ffmpegPath, ffprobePath) => {
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

module.exports = {
  createVideoFrameExtractor
}