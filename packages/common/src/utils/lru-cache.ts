export const lruCache = (keyFn, loadCache, lruSize) => {
  const cache = {};
  const lruKeys = [];

  const updateLruKeys = (key) => {
    const index = lruKeys.indexOf(key);
    if (index > 0) {
      lruKeys.splice(index, 1);
    } else if (index < 0 && lruKeys.length >= lruSize) {
      const dropKey = lruKeys.pop();
      delete cache[dropKey];
    }
    if (index != 0) {
      lruKeys.unshift(key);
    }
  }

  const getItem = (item, cb) => {
    const key = keyFn(item);
    const data = cache[key];
    if (data) {
      updateLruKeys(key);
      return cb(null, data);
    }

    loadCache(item, (err, data) => {
      if (err) {
        return cb(err);
      }
      cache[key] = data;
      updateLruKeys(key);
      cb(null, data);
    });
  }

  const clear = () => {
    Object.keys(cache).forEach(key => delete cache[key]);
    lruKeys.splice(0, lruKeys.length);
  }

  return { getItem, clear }
}
