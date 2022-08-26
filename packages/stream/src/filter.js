const through = require('./through');

function filter(predicate) {
  return through(function (entry, _, cb) {
    if (predicate(entry)) {
      this.push(entry);
    }
    cb();
  });

}

module.exports = filter;