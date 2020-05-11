const fs = require('fs');
const path = require('path');
const mkdir = require('./mkdir');

const writeSafe = (filename, data, cb) => {
  fs.writeFile(filename, data, (err) => {
    if (err && err.code === 'ENOENT') {
      mkdir(path.dirname(filename), (err) => {
        if (err) {
          return cb(err);
        }
        fs.writeFile(filename, data, cb);
      });
    } else {
      cb(err);
    }
  });
}

module.exports = writeSafe;
