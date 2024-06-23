import fs from 'fs/promises';
import path from 'path';

import { loadJSONModel } from './file-system.js';
import { downloadModel } from './download-model.js';

export const loadCachedModel = async ({ url, cacheDir, queryParams }) => {
  const cachedModel = path.join(cacheDir, 'model.json');
  return fs.access(cachedModel)
    .catch(() => {
      console.log(`Local model file does not exist. Downloading it from '${url}'`);
      return downloadModel(url, cacheDir, queryParams);
    })
    .then(() => loadJSONModel(cachedModel))
    .catch(e => console.log(`Could not load model from cache dir ${cacheDir}: ${e}`))
}
