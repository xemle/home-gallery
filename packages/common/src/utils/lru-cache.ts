export function lruCache<V, K extends string>(keyFn: (item: V) => K, loadCache: (item: V, cb: (err: Error | null, data: V) => void) => void, lruSize: number) {
  const cache = {} as Record<K, V>;
  const lruKeys: K[] = [];

  const updateLruKeys = (key) => {
    const index = lruKeys.indexOf(key);
    if (index > 0) {
      lruKeys.splice(index, 1);
    } else if (index < 0 && lruKeys.length >= lruSize) {
      const dropKey = lruKeys.pop();
      delete cache[dropKey!];
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
