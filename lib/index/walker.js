const fs = require('fs');
const path = require('path');

function handleReaddirError(err, done) {
  if (err.code === 'EACCES') {
    return done();
  }
  return done(err);
}

function forEachStat(dir, files, done, cb) {
  if (files.length === 0) {
    return done();
  }

  files.forEach(file => {
    const filename = path.join(dir, file);
    fs.lstat(filename, (err, stat) => {
      cb(err, stat, filename);
    })
  })
}

function CountDownLatch(count, done) {
  this.counter = count;
  this.done = done;
}

CountDownLatch.prototype.down = function() {
  this.counter--;
  if (!this.counter) {
    this.done();
  }
}

CountDownLatch.prototype.up = function() {
  this.counter++;
}

function walkDirectory(filename, counter, cb, done) {
  counter.up();
  walk(filename, cb, (err) => {
    if (err) {
      return done(err);
    }
    counter.down();
  });
}

function statFiles(dir, files, cb, done) {
  let counter = new CountDownLatch(files.length, done);
  forEachStat(dir, files, done, (err, stat, filename) => {
    if (err) {
      if (err.code === 'EACCES') {
        return counter.down();
      }
      return done(err);
    }

    const readDirectory = cb(filename, stat);

    if (readDirectory && stat.isDirectory()) {
      walkDirectory(filename, counter, cb, done);
    }
    counter.down();
  })
}

function walk(dir, cb, done) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return handleReaddirError(err, done);
    }

    files.sort();

    statFiles(dir, files, cb, done);
  })
}

module.exports = walk;
