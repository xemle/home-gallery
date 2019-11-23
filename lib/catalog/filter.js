const through2 = require('through2');

function filter(predicate) {
  return through2.obj(function (entry, enc, cb) {
    if (predicate(entry)) {
      this.push(entry);
    }
    cb();
  });
  
}

module.exports = filter;