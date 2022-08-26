const through = require('./through');

function map(mapFunction) {
  return through(function (entry, _, cb) {
    this.push(mapFunction(entry));
    cb();
  });

}

module.exports = map;