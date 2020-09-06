const { readJsonGzip } = require('@home-gallery/common');

function readDatabase(filename, cb) {
  readJsonGzip(filename, (err, database) => {
    if (err) {
      return cb(err);
    } else if (!database.type || database.type != 'home-gallery/database@1.0') {
      return cb(new Error(`Unknown database format ${index && index.type || 'unknown'}. Please read CHANGELOG and migrate!`))
    }
    cb(null, database);
  });
}

module.exports = readDatabase;