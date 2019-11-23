const through2 = require('through2');

const listToItems = through2.obj(function (entries, enc, cb) {
  for (let i = 0; i < entries.length; i++) {
    this.push(entries[i]);
  }
  cb();
});

module.exports = listToItems;