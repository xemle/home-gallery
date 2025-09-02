import { through } from './through.js';

export function map(mapFunction) {
  return through(function (entry, _, cb) {
    this.push(mapFunction(entry));
    cb();
  });

}
