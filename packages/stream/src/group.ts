import { through } from './through.js';

export function group({keyFn, eager, maxCount}: {keyFn: (entry: any) => string, eager?: boolean, maxCount?: number}) {
  let groups = {} as Record<string, any[]>;
  let lastKey: string | boolean = false;
  let count = 0

  const flush = (readable) => {
    Object.values(groups)
      .filter(group => group.length)
      .forEach(group => readable.push(group));
    groups = {}
    lastKey = false
    count = 0
  }

  return through(function (entry, _, cb) {
    const key = keyFn(entry);
    if (eager && lastKey && lastKey !== key) {
      flush(this);
    }
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    lastKey = key;
    count++
    if (maxCount && maxCount > 0 && count == maxCount) {
      flush(this);
    }
    cb();
  }, function(cb) {
    flush(this);
    cb();
  });

}
