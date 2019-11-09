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

CountDownLatch.prototype.down = function(err) {
  this.counter--;
  if (!this.counter || err) {
    this.counter = 0;
    this.done(err);
  }
}

CountDownLatch.prototype.up = function() {
  this.counter++;
}

function walkDirectory(filename, counter, cb, done) {
  counter.up();
  walk(filename, cb, (err) => {
    counter.down(err);
  });
}

function statFiles(dir, files, cb, done) {
  let counter = new CountDownLatch(files.length, done);
  forEachStat(dir, files, done, (err, stat, filename) => {
    if (err) {
      return counter.down(err.code === 'EACCES' ? null : err);
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
      return handleReaddirError(dir, err, done);
    }

    files.sort();

    statFiles(dir, files, cb, done);
  })
}

module.exports = walk;
