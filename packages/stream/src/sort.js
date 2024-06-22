import { through } from './through.js';

export const sort = (valueFn, reverse) => {
  const sortValue = reverse ? -1 : 1;
  return through(function (entry, _, cb) {
    if (Array.isArray(entry)) {
      entry.sort((a, b) => valueFn(a) < valueFn(b) ? -sortValue : sortValue);
    }
    this.push(entry);
    cb();
  });
}
