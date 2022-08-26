const through = require('./through');

const flatten = () => {
  return through(function (entry, _, cb) {
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