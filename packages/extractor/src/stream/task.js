import { through } from '@home-gallery/stream';

export const toPipe = (task, flush) => {
  return through(function (entry, _, cb) {
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

export const conditionalTask = (test, task) => {
  return (entry, cb) => {
    if (test(entry)) {
      task(entry, cb);
    } else {
      cb(entry);
    }
  }
}
