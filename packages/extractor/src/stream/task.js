import { through } from '@home-gallery/stream';

export const toPipe = (task, flush) => {
  return through(function (entry, _, cb) {
    task(entry, () => cb(null, entry))
  }, function (cb) {
    if (flush) {
      flush(cb)
    } else {
      cb();
    }
  });
}

export const conditionalTask = (test, task) => {
  return (entry, done) => {
    if (test(entry)) {
      task(entry, done);
    } else {
      done();
    }
  }
}

export const conditionalAsyncTask = (test, task) => {
  return (entry, done) => {
    if (test(entry)) {
      task(entry).finally(done)
    } else {
      done(entry)
    }
  }
}
