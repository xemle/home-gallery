const async = require('async');
const path = require('path');
const debug = require('debug')('index:update');

const { fileFilter } = require('@home-gallery/common');

const readIndex = require('./read');
const createIndex = require('./create');
const updateIndex = require('./update');
const writeIndex = require('./write');
const checksum = require('./checksum');

const { matcherFns } = require('./merge');
const { readStreams } = require('./read-stream');

const createOrUpdate = (directory, filename, options, cb) => {
  const now = new Date();
  async.waterfall([
    (callback) => readIndex(filename, callback),
    (fileIndex, callback) => {
      createIndex(directory, options, (err, fsEntries) => {
        if (err) {
          return callback(err);
        }
        updateIndex(fileIndex.entries, fsEntries, options.matcherFn, (err, entries, changed) => {
          if (err) {
            return callback(err);
          }
          callback(null, fileIndex, entries, changed);
        })
      })
    },
    (fileIndex, entries, changed, callback) => {
      if (changed) {
        const newIndex = {
          type: 'fileindex',
          version: 1,
          created: now.toISOString(),
          base: path.resolve(directory),
          entries
        }
        if (options.dryRun) {
          callback(null, newIndex);
        } else {
          writeIndex(filename, newIndex, callback);
        }
      } else {
        callback(null, fileIndex);
      }
    }
  ], cb);
}

const updateChecksum = (filename, index, updateChecksums, isDryRun, cb) => {
  if (updateChecksums) {
    const sha1sumDate = new Date().toISOString();
    return checksum(index, sha1sumDate, (err, index, changed) => {
      if (err) {
        return cb(err);
      } else if (changed && !isDryRun) {
        return writeIndex(filename, index, cb);
      } else {
        return cb(null, index);
      }
    })
  } else {
    return cb(null, index);
  }
}

const update = (directory, filename, options, cb) => {
  const t0 = Date.now();
  debug(`Updating file index for directory ${directory}`);
  async.waterfall([
    (callback) => fileFilter(options.exclude, options.excludeFromFile, callback),
    (filter, callback) => createOrUpdate(directory, filename, {...options, filter}, callback),
    (index, callback) => updateChecksum(filename, index, options.checksum, options.dryRun, callback)
  ], (err, index) => {
    if (err) {
      debug(`Could not update file index ${filename}: ${err}`);
      cb(err);
    } else {
      debug(`Updated file index in ${Date.now() - t0}ms`);
      cb(null, index);
    }
  });
}

module.exports = {
  readStreams,
  update,
  matcherFns
}
