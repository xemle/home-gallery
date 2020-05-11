const through2 = require('through2');

const flatten = () => {
  return through2.obj(function (entry, enc, cb) {
    if (Array.isArray(entry)) {
      for (let i = 0; i < entry.length; i++) {
        this.push(entry[i]);
      }
    } else {
      this.push(entry);
    }
    cb();
  });
};

module.exports = flatten;