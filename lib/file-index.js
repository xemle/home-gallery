const async = require('async');

const readIndex = require('./index/read');
const createIndex = require('./index/create');
const updateIndex = require('./index/update');
const writeIndex = require('./index/write');

const fileIndex = (base, indexFilename, cb) => {
  const now = new Date();
  async.waterfall([
    (callback) => readIndex(indexFilename, callback),
    (fileIndex, callback) => {
      createIndex(base, (err, fsEntries) => {
        if (err) {
          return callback(err);
        }
        updateIndex(fileIndex.entries, fsEntries, (err, entries, changed) => {
          if (err) {
            return callback(err);
          }
          callback(null, fileIndex, entries, changed);
        })
      })
    },
    (fileIndex, entries, changed, callback) => {
      if (changed) {
        writeIndex(indexFilename, {
          type: 'fileindex',
          version: 1,
          created: now.toISOString(),
          base,
          entries
        }, callback)
      } else {
        callback(null, fileIndex);
      }
    }
  ], cb);
}

module.exports = fileIndex;