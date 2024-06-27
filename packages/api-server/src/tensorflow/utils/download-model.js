import fs from 'fs/promises';
import path from 'path';

import { downloadFile, exists, dirLock, MIN_MS } from '../../utils/index.js';

const getWeightPaths = async modelFile => {
  const json = await fs.readFile(modelFile, 'utf8');
  const data = JSON.parse(json);
  const paths = data?.weightsManifest[0]?.paths;
  if (!paths) {
    console.log(`Could not find any weightManifest paths.`);
    return [];
  }
  return paths;
}

const downloadModelWeights = async (url, cacheDir, queryParams, modelFile, bulkSize) => {
  const paths = await getWeightPaths(modelFile);
  console.log(`Downloading ${paths.length} weight files`);

  const bulk = async (bulkSize) => {
    if (!paths.length) {
      return;
    }
    const parts = paths.splice(0, bulkSize);
    await Promise.all(parts.map(p => {
      return downloadFile(`${url}/${p}${queryParams}`, path.join(cacheDir, p))
        .then(() => console.log(`Downloaded weight file ${p}`))
    }))
    return bulk(bulkSize);
  }

  await bulk(bulkSize);
}

export const downloadModel = async (url, cacheDir, queryParams) => {
  const modelName = 'model.json';
  const modelFile = path.join(cacheDir, modelName);
  const lockFile = path.join(cacheDir, '.LOCK');
  const bulkSize = 5;

  await fs.mkdir(cacheDir, {recursive: true});

  await dirLock(lockFile, 5 * MIN_MS, async () => {
    // Check again if other process already downloaded the model
    const modelExists = await exists(modelFile);
    if (modelExists) {
      console.log(`Model found in cache directory ${cacheDir}. Skip downloading`)
      return;
    }

    queryParams = queryParams || '';
    await downloadFile(`${url}/${modelName}${queryParams}`, modelFile);
    console.log(`Downloaded ${modelName}`);

    await downloadModelWeights(url, cacheDir, queryParams, modelFile, bulkSize);
    console.log(`Downloaded model to cache directory ${cacheDir}`)
  })
}

