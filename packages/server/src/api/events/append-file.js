const fs = require('fs');

const append = (filename, data, cb) => {
  const line = `${JSON.stringify(data)}\n`;
  fs.appendFile(filename, line, (err) => {
    if (err) {
      cb(err);
    } else {
      cb();
    }
  });
}

module.exports = append;
