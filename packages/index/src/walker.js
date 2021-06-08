const fs = require('fs');
const path = require('path');
const debug = require('debug')('walker');

function handleReaddirError(dir, err, done) {
  if (err.code === 'EACCES') {
    debug(`Read of directory ${dir} failed: Permission denied`);
    return done();
  }
  return done(err);
}

function readFileStats(dir, files, cb) {
  const fileStats = [];
  let countDownLatch = files.length;
  let hasError = false;

  files.forEach(file => {
    if (hasError) {
      return;
    }

    const filename = path.join(dir, file);
    fs.lstat(filename, (err, stat) => {
      if (hasError) {
        return;
      } else if (err) {
        hasError = true;
        debug(`Could not read file stat of ${filename}: ${err}`);
        return cb(err);
      }

      fileStats.push({filename, stat});

      countDownLatch--;
      if (!countDownLatch) {
        cb(null, fileStats);
      }
    })
  })
}

function walkFiles(dir, filesMapper, fileStats, cb, done) {
  while (fileStats.length) {
    const { filename, stat } = fileStats.pop();

    const readDirectory = cb(filename, stat);

    if (readDirectory && stat.isDirectory()) {
      return walkDir(filename, filesMapper, cb, (err) => {
        if (err) {
          return done(err);
        }
        return walkFiles(dir, filesMapper, fileStats, cb, done);
      });
    }
  }
  return done();
}

function byDirDescNameAsc(a, b) {
  const aIsDir = a.stat.isDirectory();
  if (aIsDir === b.stat.isDirectory()) {
    const rev = aIsDir ? -1 : 1
    return a.filename < b.filename ? rev : -1 * rev;
  } else {
    return aIsDir ? 1 : -1;
  }
}

function walkDir(dir, filesMapper, cb, done) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return handleReaddirError(dir, err, done);
    } else if (!files.length) {
      return done();
    }

    const mappedFiles = filesMapper(files);
    if (!mappedFiles.length) {
      return done();
    }

    readFileStats(dir, mappedFiles, (err, fileStats) => {
      if (err) {
        return done(err);
      }

      fileStats.sort(byDirDescNameAsc);
      walkFiles(dir, filesMapper, fileStats, cb, done);
    });
  })
}

module.exports = walkDir;
