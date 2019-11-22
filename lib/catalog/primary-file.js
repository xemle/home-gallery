const through2 = require('through2');

const primaryFile = through2.obj(function (entries, enc, cb) {
  entries.sort((a, b) => b.size < a.size);

  const primary = entries.shift();
  this.push(Object.create({primary, sidecars: entries}));
  cb();
});

module.exports = primaryFile;