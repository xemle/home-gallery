const { group } = require('@home-gallery/stream');
const { getMetaCacheKey } = require('@home-gallery/storage');

const groupByMetaCache = () => group({
  keyFn: getMetaCacheKey,
  eager: true
});

module.exports = groupByMetaCache;

