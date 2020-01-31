const fs = require('fs');
const ignore = require('ignore');

const fileFilter = (excludes, excludesFromFile, cb) => {
  if ((!excludes || !excludes.length) && !excludesFromFile) {
    return cb(null, () => true);
  }
  const ig = ignore().add(excludes || []);
  
  if (!excludesFromFile) {
    return cb(null, ig.createFilter());
  }

  fs.readFile(excludesFromFile, 'utf-8', (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return cb(new Error(`Exclude file ${excludesFromFile} does not exist`))
      }
      return cb(err);
    }
    ig.add(content);
    cb(null, ig.createFilter());
  })
}

module.exports = fileFilter;