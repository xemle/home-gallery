const through2 = require('through2');

const sort = (valueFn) => {
  return through2.obj(function (entry, enc, cb) {
    if (Array.isArray(entry)) {
      entry.sort((a, b) => valueFn(a) < valueFn(b) ? -1 : 1);
    }
    this.push(entry);
    cb();
  });
}

module.exports = sort;
