const through = require('./through');

const toList = () => {
  const list = [];
  return through(function (entry, _, cb) {
    list.push(entry);
    cb();
  }, function (cb) {
    this.push(list);
    cb();
  });
}

module.exports = toList;
