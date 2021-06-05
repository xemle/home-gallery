const async = require('async');
const path = require('path');
const debug = require('debug')('index:update');

const { fileFilter } = require('@home-gallery/common');

const readIndex = require('./read');
const createIndex = require('./create');
const updateIndex = require('./update');
const writeIndex = require('./write');
const checksum = require('./checksum');
const { statIndex, prettyPrint } = require('./stat')

const { matcherFns } = require('./merge');
const { readStream, readStreams } = require('./read-stream');
const createLimitFilter = require('./limit-filter');

const createOrUpdate = (directory, filename, options, cb) => {
  const now = new Date();
  async.waterfall([
    (callback) => readIndex(filename, callback),
    (fileIndex, callback) => createLimitFilter(fileIndex.data.length, options.addLimits, options.filter, (err, filter) => callback(err, fileIndex, filter)),
    (fileIndex, limitFilter, callback) => {
      createIndex(directory, {...options, filter: limitFilter}, (err, fsEntries) => {
        if (err) {
          return callback(err);
        }
        updateIndex(fileIndex.data, fsEntries, options.matcherFn, (err, entries, changed) => {
          if (err) {
            return callback(err);
          }
          callback(null, fileIndex, entries, changed, limitFilter.limitExceeded());
        })
      })
    },
    (fileIndex, entries, changed, limitExceeded, callback) => {
      if (changed) {
        const newIndex = {
          type: 'home-gallery/fileindex@1.0',
          created: now.toISOString(),
          base: path.resolve(directory),
          data: entries
        }
        if (options.dryRun) {
          callback(null, newIndex, limitExceeded);
        } else {
          writeIndex(filename, newIndex, (err, index) => callback(err, index, limitExceeded));
        }
      } else {
        callback(null, fileIndex, limitExceeded);
      }
    }
  ], cb);
}

const updateChecksum = (filename, index, updateChecksums, isDryRun, limitExeeded, cb) => {
  if (updateChecksums) {
    const sha1sumDate = new Date().toISOString();
    return checksum(index, sha1sumDate, (err, index, changed) => {
      if (err) {
        return cb(err);
      } else if (changed && !isDryRun) {
        return writeIndex(filename, index, (err, index) => cb(err, index, limitExeeded));
      } else {
        return cb(null, index, limitExeeded);
      }
    })
  } else {
    return cb(null, index, limitExeeded);
  }
}

const update = (directory, filename, options, cb) => {
  const t0 = Date.now();
  debug(`Updating file index for directory ${directory}`);
  async.waterfall([
    (callback) => fileFilter(options.exclude, options.excludeFromFile, callback),
    (filter, callback) => createOrUpdate(directory, filename, {...options, filter}, callback),
    (index, limitExeeded, callback) => updateChecksum(filename, index, options.checksum, options.dryRun, limitExeeded, callback)
  ], (err, index, limitExeeded) => {
    if (err) {
      debug(`Could not update file index ${filename}: ${err}`);
      cb(err);
    } else {
      debug(`Updated file index in ${Date.now() - t0}ms`);
      cb(null, index, limitExeeded);
    }
  });
}

module.exports = {
  readStream,
  readStreams,
  update,
  matcherFns,
  prettyPrint,
  statIndex
}
