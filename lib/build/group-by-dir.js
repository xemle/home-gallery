const path = require('path');
const group = require('../stream/group');

const groupByDir = () => group({
  keyFn: (entry) => path.dirname(entry.filename),
  eager: true
});

module.exports = groupByDir;
