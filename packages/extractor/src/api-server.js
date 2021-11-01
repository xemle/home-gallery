const request = require('request');

const log = require('@home-gallery/logger')('extractor.apiEntry');
const { parallel } = require('@home-gallery/stream');
const { conditionalTask } = require('./task');

const ERROR_THRESHOLD = 5;

const apiServerEntry = (storage, {name, apiServerUrl, apiPath, imageSuffix, entrySuffix, concurrent, timeout}) => {
  let currentErrors = 0;

  const test = entry => {
    if (currentErrors > ERROR_THRESHOLD) {
      return false;
    } else if (!storage.hasEntryFile(entry, imageSuffix) || storage.hasEntryFile(entry, entrySuffix)) {
      return false;
    } else if (entry.type === 'image' || entry.type === 'rawImage') {
      return true;
    } else {
      return false;
    }
  }

  const addError = () => {
    currentErrors++;
    if (currentErrors > ERROR_THRESHOLD) {
      log.warn(`Too many errors. Skip processing of ${name}`);
    }
  }

  const task = (entry, cb) =>{
    const t0 = Date.now();
    storage.readEntryFile(entry, imageSuffix, (err, buffer) => {
      if (err) {
        log.warn(`Could not read image entry file ${imageSuffix} from ${entry}: ${err}. Skip ${name} for this entry`);
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
          addError();
          log.warn(err, `Could not get ${name} of ${entry} from URL ${url}: ${err}`);
          return cb();
        } else if (res.statusCode < 100 || res.statusCode >= 300) {
          addError();
          log.error(err, `Could not get ${name} of ${entry} from URL ${url}: HTTP response code is ${res.statusCode}`);
          return cb();
        }
        storage.writeEntryFile(entry, entrySuffix, body, (err) => {
          if (err) {
            log.warn(err, `Could write ${name} of ${entry}: ${err}`);
          } else {
            if (currentErrors > 0) {
              currentErrors--;
            }
            log.debug(t0, `Fetched ${name} for ${entry}`);
          }
          cb();
        });
      })
    });
  }

  return parallel({task: conditionalTask(test, task), concurrent});
}

const similarEmbeddings = (storage, apiServerUrl, similarityEmbeddingsPreviewSize) => {
  return apiServerEntry(storage, {
    name: 'similarity embeddings',
    apiServerUrl,
    apiPath: '/embeddings',
    imageSuffix: `image-preview-${similarityEmbeddingsPreviewSize}.jpg`,
    entrySuffix: 'similarity-embeddings.json',
    concurrent: 5,
    timeout: 30000,
  })
}

const objectDetection = (storage, apiServerUrl, imagePreviewSize) => {
  return apiServerEntry(storage, {
    name: 'object detection',
    apiServerUrl,
    apiPath: '/objects',
    imageSuffix: `image-preview-${imagePreviewSize}.jpg`,
    entrySuffix: 'objects.json',
    concurrent: 5,
    timeout: 30000,
  })
}

const faceDetection = (storage, apiServerUrl, imagePreviewSize) => {
  return apiServerEntry(storage, {
    name: 'face detection',
    apiServerUrl,
    apiPath: '/faces',
    imageSuffix: `image-preview-${imagePreviewSize}.jpg`,
    entrySuffix: 'faces.json',
    concurrent: 2,
    timeout: 30000,
  })
}

module.exports = {
  apiServerEntry,
  similarEmbeddings,
  objectDetection,
  faceDetection
}
