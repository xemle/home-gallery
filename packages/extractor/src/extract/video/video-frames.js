const log = require('@home-gallery/logger')('extractor.video.frames');

const { toPipe, conditionalTask } = require('../../stream/task');

const videoPreviewSuffix = 'video-preview-720.mp4';
const firstFrameSuffix = 'video-frame-001.jpg';
const framePatternSuffix = 'video-frame-%00i.jpg';

function videoFrames(storage, videoFrameExtractor, frameCount) {
  const test = entry => entry.type === 'video' && storage.hasEntryFile(entry, videoPreviewSuffix) && !storage.hasEntryFile(entry, firstFrameSuffix);

  const task = (entry, cb) => {
    const videoPreview = storage.getEntryFilename(entry, videoPreviewSuffix);
    const entryDir = storage.getEntryDirname(entry);
    const filenamePattern = storage.getEntryBasename(entry, framePatternSuffix);
    videoFrameExtractor(videoPreview, entryDir, filenamePattern, frameCount, (err, filenames) => {
      if (err) {
        log.error(err, `Could not extract video frames from ${entry}: ${err}`);
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

module.exports = {videoFrames, createVideoFrameExtractor};