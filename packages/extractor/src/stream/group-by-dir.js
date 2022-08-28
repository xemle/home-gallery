const path = require('path');
const { group } = require('@home-gallery/stream');

const groupByDir = () => group({
  keyFn: (entry) => path.dirname(entry.filename),
  eager: true
});

module.exports = {
  groupByDir
}
