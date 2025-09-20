import fs from 'fs/promises';
import path from 'path';

import logger from '../../utils/logger.js';

import { loadJSONModel } from './file-system.js';
import { downloadModel } from './download-model.js';

export const loadCachedModel = async ({ url, cacheDir, queryParams }) => {
  const cachedModel = path.join(cacheDir, 'model.json');
  return fs.access(cachedModel)
    .catch(() => {
      logger.info(`Local model file does not exist. Downloading it from '${url}'`);
      return downloadModel(url, cacheDir, queryParams);
    })
    .then(() => loadJSONModel(cachedModel))
    .catch(e => logger.error(e, `Could not load model from cache dir ${cacheDir}: ${e}`))
}
