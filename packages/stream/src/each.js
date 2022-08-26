const through = require('./through');

function each(fn) {
  return through(function (entry, _, cb) {
    fn(entry);
    this.push(entry);
    cb();
  });

}

module.exports = each;