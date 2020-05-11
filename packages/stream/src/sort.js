const through2 = require('through2');

const sort = (valueFn, reverse) => {
  const sortValue = reverse ? -1 : 1;
  return through2.obj(function (entry, enc, cb) {
    if (Array.isArray(entry)) {
      entry.sort((a, b) => valueFn(a) < valueFn(b) ? -sortValue : sortValue);
    }
    this.push(entry);
    cb();
  });
}

module.exports = sort;
