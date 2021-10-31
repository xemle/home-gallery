const ffmpeg = require('fluent-ffmpeg');

const log = require('@home-gallery/logger')('extractor.video.frameExtractor');

const createVideoFrameExtractor = (ffmpegPath, ffprobePath) => {
  return (src, dir, filenamePattern, frameCount, cb) => {
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
        log.debug(t0, `Extracted ${files.length} video frames from ${src}`);
        cb(null, files);
      })
      .screenshot({
        count: frameCount,
        folder: dir,
        filename: filenamePattern
      });
  }
}

module.exports = {
  createVideoFrameExtractor
}