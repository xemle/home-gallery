const fs = require('fs').promises;
const path = require('path');

const { loadJSONModel } = require('./utils/file-system');
const downloadModel = require('./download-model');

const loadCachedModel = async ({ url, cacheDir, queryParams }) => {
  const cachedModel = path.join(cacheDir, 'model.json');
  return fs.access(cachedModel)
    .catch(() => {
      console.log(`Local model file does not exist. Downloading it from '${url}'`);
      return downloadModel(url, cacheDir, queryParams);
    })
    .then(() => loadJSONModel(cachedModel))
    .catch(e => console.log(`Could not load model from cache dir ${cacheDir}: ${e}`))
}

module.exports = loadCachedModel;
