import { through } from './through.js';

export function filter(predicate) {
  return through(function (entry, _, cb) {
    if (predicate(entry)) {
      this.push(entry);
    }
    cb();
  });

}
