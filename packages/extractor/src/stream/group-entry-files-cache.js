const { group } = require('@home-gallery/stream');
const { getEntryFilesCacheKey } = require('@home-gallery/storage');

const groupByEntryFilesCacheKey = () => group({
  keyFn: getEntryFilesCacheKey,
  eager: true
});

module.exports = groupByEntryFilesCacheKey;

