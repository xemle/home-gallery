const request = require('request');
const debug = require('debug')('extract:similarity');

const { parallel } = require('@home-gallery/stream');
const { conditionalTask } = require('./task');

const similaritySuffix = 'similarity-embeddings.json';

function similiarity(storage, imageSuffix, concurrent) {
  let hasError = false;

  const test = entry => {
    if (hasError) {
      return false;
    } else if (!storage.hasEntryFile(entry, imageSuffix) || storage.hasEntryFile(entry, similaritySuffix)) {
      return false;
    } else if (entry.type === 'image') {
      return true;
    } else {
      return false;
    }
  }

  const task = (entry, cb) =>{
    const t0 = Date.now();
    storage.readEntryFile(entry, imageSuffix, (err, buffer) => {
      if (err) {
        debug(`Could not read image entry file ${imageSuffix} from ${entry}: ${err}. Skip similarity embeddings for this entry`);
        return cb();
      }

      const url = 'https://api.home-gallery.org/embeddings';
      const options = {
        url,
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
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
        storage.writeEntryFile(entry, similaritySuffix, body, (err) => {
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

  return parallel({task: conditionalTask(test, task), concurrent});
}

module.exports = similiarity;
