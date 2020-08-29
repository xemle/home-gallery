const through2 = require('through2');

const toPipe = (task, flush) => {
  return through2.obj(function (entry, _, cb) {
    const that = this;
    task(entry, () => {
      that.push(entry);
      cb();
    })
  }, function (cb) {
    if (flush) {
      flush(cb)
    } else {
      cb();
    }
  });
}

const conditionalTask = (test, task) => {
  return (entry, cb) => {
    if (test(entry)) {
      task(entry, cb);
    } else {
      cb(entry);
    }
  }
}

module.exports = {
  toPipe,
  conditionalTask
}