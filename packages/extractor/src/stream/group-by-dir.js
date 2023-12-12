const path = require('path');
const { group } = require('@home-gallery/stream');

const groupByDir = (maxCount = 0) => group({
  keyFn: (entry) => path.dirname(entry.filename),
  eager: true,
  maxCount
});

module.exports = {
  groupByDir
}
