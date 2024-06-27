import { through } from './through.js';

export const toList = () => {
  const list = [];
  return through(function (entry, _, cb) {
    list.push(entry);
    cb();
  }, function (cb) {
    this.push(list);
    cb();
  });
}
