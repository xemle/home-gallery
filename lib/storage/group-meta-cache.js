const group = require('../stream/group');
const { getMetaCacheKey } = require('./meta-cache-key');

const groupByMetaCache = () => group({
  keyFn: getMetaCacheKey,
  eager: true
});

module.exports = groupByMetaCache;

