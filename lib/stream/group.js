const through2 = require('through2');

function group({keyFn, eager}) {
  let groups = {};
  let lastKey = false;

  return through2.obj(function (entry, enc, cb) {
    const key = keyFn(entry);
    if (lastKey === false) {
      groups[key] = [entry];
    } else if (eager && lastKey !== key) {
      this.push(groups[lastKey]);
      delete groups[lastKey];
      groups[key] = [entry];
    } else {
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    }
    lastKey = key;
    cb();
  }, function(cb) {
    const that = this;
    Object.values(groups)
      .filter(group => group.length)
      .forEach(group => that.push(group));
    cb();
  });

}

module.exports = group;