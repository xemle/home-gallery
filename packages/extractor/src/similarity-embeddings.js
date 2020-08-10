const fs = require('fs');
const path = require('path');
const request = require('request');
const through2 = require('through2');
const debug = require('debug')('extract:similarity');

const { getStoragePaths, writeStorageFile } = require('@home-gallery/storage');

const getEntryFile = (entry, suffix) => {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  return path.join(dir, `${prefix}-${suffix}`);
}

const hasEntryFile = (entry, suffix) => {
  const entryFile = getEntryFile(entry, suffix);
  return entry.files.indexOf(entryFile) >= 0;
}

function similiarity(storageDir, imageSuffix) {
  let hasError = false;

  function condition(entry, cb) {
    if (hasError) {
      cb(false);
    } else if (!hasEntryFile(entry, imageSuffix) || hasEntryFile(entry, 'similarity-embeddings.json')) {
      cb(false);
    } else if (entry.type === 'image') {
      cb(true);
    } else {
      cb(false);
    }
  }

  function task(entry, cb) {
    const t0 = Date.now();
    const entryFile = getEntryFile(entry, imageSuffix);
    const filePath = path.join(storageDir, entryFile);
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        debug(`Could not read entry file ${entryFile} from ${entry}: ${err}. Skip similarity embeddings for this entry`);
        return cb();
      }

      const url = 'http://localhost:9012/embeddings';
      const options = {
        url,
        method: 'POST',
        body: buffer,
        encoding: null
      }
      request(options, (err, res, body) => {
        if (err) {
          hasError = true;
          debug(`Could not get similarity embeddings of ${entry} from URL ${url}: ${err}. Skip all further similarity embeddings`);
          return cb();
        } else if (res.statusCode < 100 || res.statusCode >= 300) {
          hasError = true;
          debug(`Could not get similarity embeddings of ${entry} from URL ${url}: HTTP response code is ${res.statusCode}. Skip all further similarity embeddings`);
          return cb();
        }
        const similiarityEmbeddings = getEntryFile(entry, 'similarity-embeddings.json');
        writeStorageFile(entry, storageDir, similiarityEmbeddings, body, (err) => {
          if (err) {
            debug(`Could write similarity embeddings of ${entry}: ${err}`);
          } else {
            debug(`Fetched similarity embeddings for ${entry} in ${Date.now() - t0}ms`);
          }
          cb();
        });
      })
    });
  }

  const taskPipe = (condition, task) => {
    return through2.obj(function (entry, enc, cb) {
      const that = this;
      const next = function() {
        that.push(entry);
        cb();
      }

      condition(entry, runTask => {
        if (runTask) {
          task(entry, next);
        } else {
          next();
        }
      });
    });
  }

  return taskPipe(condition, task);
}

module.exports = similiarity;
