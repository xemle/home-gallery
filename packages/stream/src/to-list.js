const through2 = require('through2');

const toList = () => {
  const list = [];
  return through2.obj(function (entry, enc, cb) {
    list.push(entry);
    cb();
  }, function (cb) {
    this.push(list);
    cb();
  });
}

module.exports = toList;
