import { through } from './through.js';

export function each(fn) {
  return through(function (entry, _, cb) {
    fn(entry);
    this.push(entry);
    cb();
  });

}
