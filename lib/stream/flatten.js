const through2 = require('through2');

const flatten = through2.obj(function (list, enc, cb) {
  const that = this;
  if (Array.isArray(list)) {
    list.forEach(item => that.push(item));
  } else {
    that.push(item);
  }
  cb();
});

module.exports = flatten;