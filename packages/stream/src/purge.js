const through2 = require('through2');

const purge = () => {
  return through2.obj(function (entry, enc, cb) {
    cb();
  });
}

module.exports = purge;
