const through2 = require('through2');

function each(fn) {
  return through2.obj(function (entry, enc, cb) {
    fn(entry);
    this.push(entry);
    cb();
  });

}

module.exports = each;