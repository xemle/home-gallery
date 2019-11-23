const path = require('path');
const through2 = require('through2');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const debug = require('debug')('ffprobe');

const getStoragePaths = require('./storage-path');
const writeEntryFile = require('./write-entry-file');

function execFfprobe(storageDir, entry, cb) {
  const src = entry.src;

  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  const filename = path.join(dir, `${prefix}-ffprobe.json`);

  if (entry.files.indexOf(filename) >= 0) {
    return cb();
  }

  ffprobe(src, { path: ffprobeStatic.path }, function (err, info) {
    if (err) {
      return cb(err);
    }

    writeEntryFile(entry, storageDir, filename, JSON.stringify(info), (err) => {
      if (err) {
        return cb(err);
      }
      debug(`Extracted video meta data from ${entry.filename}`);
      cb();
    })
  });
}

function videoMeta(storageDir) {
  return through2.obj(function (entry, enc, cb) {
    const that = this;
    if (entry.type === 'video') {
      execFfprobe(storageDir, entry, (err) => {
        if (err) {
          debug(`Could not extract video metadata of ${entry.filename}: ${err}`);
        }
        that.push(entry);
        cb();
      })
    } else {
      this.push(entry);
      cb();
    }

  });
}

module.exports = videoMeta;