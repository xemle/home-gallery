const fs = require('fs').promises;
const path = require('path');

const { loadJSONModel } = require('./file-system');
const mkdirp = require('./mkdirp');
const downloadFile = require('./download-file');

const MODEL_NAME = 'model.json';

const downloadModel = async (url, cacheDir, queryParams) => {
  queryParams = queryParams || '';
  const file = path.join(cacheDir, MODEL_NAME);
  await mkdirp(cacheDir);
  await downloadFile(`${url}/${MODEL_NAME}${queryParams}`, file);
  console.log(`Downloaded ${MODEL_NAME}`);

  const json = await fs.readFile(file, 'utf8');
  const data = JSON.parse(json);
  const paths = data?.weightsManifest[0]?.paths;
  if (!paths) {
    console.log(`Could not find any weightManifest paths. Downloading done`);
    return;
  }

  const bulk = async (count) => {
    if (!paths.length) {
      return;
    }
    const parts = paths.splice(0, count);
    await Promise.all(parts.map(p => {
      return downloadFile(`${url}/${p}${queryParams}`, path.join(cacheDir, p))
        .then(() => console.log(`Downloaded weight file ${p}`))
    }))
    return bulk(count);
  }
  await bulk(5);

  console.log(`Downloaded model to cache directory ${cacheDir}`)
}

const loadCachedModel = async ({ url, cacheDir, queryParams }) => {
  const cachedModel = path.join(cacheDir, MODEL_NAME);
  return fs.access(cachedModel)
    .catch(() => {
      console.log(`Local model file does not exist. Start downloading it from '${url}'`);
      return downloadModel(url, cacheDir, queryParams);
    })
    .then(() => loadJSONModel(cachedModel))
    .catch(e => console.log(`Could not load model from URL ${url} or cache dir ${cacheDir}: ${e}`))
}

module.exports = loadCachedModel;
