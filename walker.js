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
    fs.stat(filename, (err, stat) => {
      cb(err, stat, filename);
    })
  })
}

function decrementCounter(counter, done) {
  if (counter === 0) {
    return counter;
  }

  counter--;
  if (counter === 0) {
    done()
  }
  return counter;
}

function walk(dir, cb, done) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return handleReaddirError(err, done);
    }

    let counter = files.length;
    forEachStat(dir, files, done, (err, stat, filename) => {
      if (err) {
        if (err.code === 'EACCES') {
          counter = decrementCounter(counter, done)
          return;
        }
        return done(err);
      }

      cb(filename, stat);

      if (stat.isDirectory()) {
        counter++;
        walk(filename, cb, (err) => {
          if (err) {
            return done(err);
          }
          counter = decrementCounter(counter, done);
        });
      }
      counter = decrementCounter(counter, done);
    })
  })
}

module.exports = walk;