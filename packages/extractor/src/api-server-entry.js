const request = require('request');
const debug = require('debug')('extract:api-entry');

const { parallel } = require('@home-gallery/stream');
const { conditionalTask } = require('./task');

const apiServerEntry = (storage, {name, apiServerUrl, apiPath, imageSuffix, entrySuffix, concurrent, timeout}) => {
  let hasError = false;

  const test = entry => {
    if (hasError) {
      return false;
    } else if (!storage.hasEntryFile(entry, imageSuffix) || storage.hasEntryFile(entry, entrySuffix)) {
      return false;
    } else if (entry.type === 'image' || entry.type === 'rawImage') {
      return true;
    } else {
      return false;
    }
  }

  const task = (entry, cb) =>{
    const t0 = Date.now();
    storage.readEntryFile(entry, imageSuffix, (err, buffer) => {
      if (err) {
        debug(`Could not read image entry file ${imageSuffix} from ${entry}: ${err}. Skip ${name} for this entry`);
        return cb();
      }

      const url = `${apiServerUrl}${apiPath}`;
      const options = {
        url,
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: buffer,
        encoding: null,
        timeout,
      }
      request(options, (err, res, body) => {
        if (err) {
          hasError = true;
          debug(`Could not get ${name} of ${entry} from URL ${url}: ${err}. Skip processing of ${name}`);
          return cb();
        } else if (res.statusCode < 100 || res.statusCode >= 300) {
          hasError = true;
          debug(`Could not get ${name} of ${entry} from URL ${url}: HTTP response code is ${res.statusCode}. Skip processing of ${name}`);
          return cb();
        }
        storage.writeEntryFile(entry, entrySuffix, body, (err) => {
          if (err) {
            debug(`Could write ${name} of ${entry}: ${err}`);
          } else {
            debug(`Fetched ${name} for ${entry} in ${Date.now() - t0}ms`);
          }
          cb();
        });
      })
    });
  }

  return parallel({task: conditionalTask(test, task), concurrent});
}

module.exports = apiServerEntry;
