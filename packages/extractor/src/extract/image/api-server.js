const request = require('request');

const log = require('@home-gallery/logger')('extractor.apiEntry');
const { parallel } = require('@home-gallery/stream');

const { conditionalTask } = require('../../stream/task');
const { sizeToImagePreviewSuffix } = require('./image-preview')

const ERROR_THRESHOLD = 5
const PUBLIC_API_SERVER = 'https://api.home-gallery.org'
const DOCUMENATION_URL = 'https://docs.home-gallery.org'

const getEntryFileBySuffixes = (storage, entry, suffixes) => suffixes.find(suffix => storage.hasEntryFile(entry, suffix));

const apiServerEntry = (storage, {name, apiServerUrl, apiPath, imagePreviewSuffixes, entrySuffix, concurrent, timeout}) => {
  let currentErrors = 0;

  const test = entry => {
    if (currentErrors > ERROR_THRESHOLD) {
      return false;
    } else if (!getEntryFileBySuffixes(storage, entry, imagePreviewSuffixes) || storage.hasEntryFile(entry, entrySuffix)) {
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
    const imagePreviewSuffix = getEntryFileBySuffixes(storage, entry, imagePreviewSuffixes);
    storage.readEntryFile(entry, imagePreviewSuffix, (err, buffer) => {
      if (err) {
        log.warn(`Could not read image entry file ${imagePreviewSuffix} from ${entry}: ${err}. Skip ${name} for this entry`);
        return cb();
      }

      const url = `${apiServerUrl}${apiPath}`;
      const options = {
        url,
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: buffer,
        encoding: null,
        timeout: timeout * 1000,
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

const logPublicApiPrivacyHint = (apiServerUrl, feature) => {
  if (!apiServerUrl.startsWith(PUBLIC_API_SERVER)) {
    return
  }
  log.warn(`You are using the public api server ${apiServerUrl} for ${feature}. Please read its documentation at ${DOCUMENATION_URL} for privacy concerns`)
}

const similarEmbeddings = (storage, apiServerUrl, imagePreviewSizes, timeout = 30, concurrent = 5) => {
  logPublicApiPrivacyHint(apiServerUrl, 'similar images')
  return apiServerEntry(storage, {
    name: 'similarity embeddings',
    apiServerUrl,
    apiPath: '/embeddings',
    imagePreviewSuffixes: imagePreviewSizes.map(sizeToImagePreviewSuffix),
    entrySuffix: 'similarity-embeddings.json',
    concurrent,
    timeout,
  })
}

const objectDetection = (storage, apiServerUrl, imagePreviewSizes, timeout = 30, concurrent = 5) => {
  logPublicApiPrivacyHint(apiServerUrl, 'object detection')
  return apiServerEntry(storage, {
    name: 'object detection',
    apiServerUrl,
    apiPath: '/objects',
    imagePreviewSuffixes: imagePreviewSizes.map(sizeToImagePreviewSuffix),
    entrySuffix: 'objects.json',
    concurrent,
    timeout,
  })
}

const faceDetection = (storage, apiServerUrl, imagePreviewSizes, timeout = 30, concurrent = 2) => {
  logPublicApiPrivacyHint(apiServerUrl, 'face detection')
  return apiServerEntry(storage, {
    name: 'face detection',
    apiServerUrl,
    apiPath: '/faces',
    imagePreviewSuffixes: imagePreviewSizes.map(sizeToImagePreviewSuffix),
    entrySuffix: 'faces.json',
    concurrent,
    timeout,
  })
}

module.exports = {
  apiServerEntry,
  similarEmbeddings,
  objectDetection,
  faceDetection
}
