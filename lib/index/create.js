const path = require('path');

const walk = require('./walker');
const debug = require('debug')('index:create');

const createIndex = (dir, fileFilterFn, cb) => {
  const entries = [];
  const t0 = Date.now();
  walk(dir, (filename, stat) => {
    const relativeFilename = path.relative(dir, filename);
    if (!fileFilterFn(relativeFilename)) {
      return false;
    }
    entries.push(Object.assign({}, stat, {
      filename: relativeFilename,
      sha1sum: '',
      sha1sumDate: null,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymbolicLink: stat.isSymbolicLink(),
      isOther: !stat.isFile() && !stat.isDirectory() && !stat.isSymbolicLink(),
      fileType: stat.isDirectory() ? 'd' : (stat.isFile() ? 'f' : (stat.isSymbolicLink() ? 'l' : 'o'))
    }));
    return true;
  }, (err) => {
    if (err) {
      debug(`Could not read files in ${dir}: ${err}`);
      return cb(err);
    } 
    debug(`Read ${entries.length} files in ${dir} in ${Date.now() - t0}ms`);
    cb(null, entries);
  });
}

module.exports = createIndex;
