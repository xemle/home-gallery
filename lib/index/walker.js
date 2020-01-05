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
  let lastErr = null;

  files.forEach(file => {
    if (lastErr) {
      return;
    }

    const filename = path.join(dir, file);
    fs.lstat(filename, (err, stat) => {
      if (err) {
        lastErr = err;
        debug(`Could not read file ${filename}: ${err}`);
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

function walkFiles(dir, fileStats, cb, done) {
  while (fileStats.length) {
    const { filename, stat } = fileStats.shift();

    const readDirectory = cb(filename, stat);

    if (readDirectory && stat.isDirectory()) {
      return walkDir(filename, cb, (err) => {
        if (err) {
          return done(err);
        }
        return walkFiles(dir, fileStats, cb, done);
      });
    }
  }
  return done();
}

function sortByDirAndName(a, b) {
  const aIsDir = a.stat.isDirectory();
  if (aIsDir === b.stat.isDirectory()) {
    return a.filename < b.filename ? -1 : 1;
  } else {
    return aIsDir ? -1 : 1;
  }
}

function walkDir(dir, cb, done) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return handleReaddirError(dir, err, done);
    } else if (!files.length) {
      return done();
    }

    readFileStats(dir, files, (err, fileStats) => {
      if (err) {
        return done(err);
      }
      
      fileStats.sort(sortByDirAndName);
      walkFiles(dir, fileStats, cb, done);
    });
  })
}

module.exports = walkDir;
