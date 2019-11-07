const fs = require('fs');
const path = require('path');

function walk(dir, cb, done) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      if (err.code === 'EACCES') {
        return done();
      }
      return done(err);
    }
    if (files.length === 0) {
      return done();
    }
    let counter = files.length;
    files.forEach(file => {
      const filename = path.join(dir, file);
      fs.stat(filename, (err, stat) => {
        if (err) {
          if (err.code === 'EACCES') {
            counter--;
            if (counter === 0) {
              done();
            }
          } else {
            done(err)
          }
          return;
        }
        cb(filename, stat);

        if (stat.isDirectory()) {
          counter++;
          walk(filename, cb, (err) => {
            if (err) {
              done(err);
            }
            counter--;
            if (counter === 0) {
              done();
            }
          });
        }
        counter--;
        if (counter === 0) {
          done();
        }
      })
    })
  })
}

module.exports = walk;