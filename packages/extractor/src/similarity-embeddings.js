const fs = require('fs');
const path = require('path');
const request = require('request');
const debug = require('debug')('extract:similarity');

const { getStoragePaths, readStorageFile, writeStorageFile } = require('@home-gallery/storage');
const { parallel } = require('@home-gallery/stream');

const similaritySuffix = 'similarity-embeddings.json';

const buildEntryFile = (entry, suffix) => {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);
  return path.join(dir, `${prefix}-${suffix}`);
}

const hasEntryFile = (entry, suffix) => {
  const entryFile = buildEntryFile(entry, suffix);
  return entry.files.indexOf(entryFile) >= 0;
}

function similiarity(storageDir, imageSuffix, concurrent) {
  let hasError = false;

  function testAsync(entry, cb) {
    if (hasError) {
      cb(false);
    } else if (!hasEntryFile(entry, imageSuffix) || hasEntryFile(entry, similaritySuffix)) {
      cb(false);
    } else if (entry.type === 'image') {
      cb(true);
    } else {
      cb(false);
    }
  }

  function taskAsync(entry, cb) {
    const t0 = Date.now();
    const imageEntryFile = buildEntryFile(entry, imageSuffix);
    readStorageFile(storageDir, imageEntryFile, (err, buffer) => {
      if (err) {
        debug(`Could not read image entry file ${imageEntryFile} from ${entry}: ${err}. Skip similarity embeddings for this entry`);
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
        const similarityEntryFile = buildEntryFile(entry, similaritySuffix);
        writeStorageFile(entry, storageDir, similarityEntryFile, body, (err) => {
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

  return parallel({testAsync, taskAsync, concurrent});
}

module.exports = similiarity;
