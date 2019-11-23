const through2 = require('through2');

function map(mapFunction) {
  return through2.obj(function (entry, enc, cb) {
    this.push(mapFunction(entry));
    cb();
  });
  
}

module.exports = map;