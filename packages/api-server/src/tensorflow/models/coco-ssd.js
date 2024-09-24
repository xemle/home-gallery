import path from 'path';
import cocoSsd from '@tensorflow-models/coco-ssd';

import { loadCachedModel } from '../utils/index.js'

const toCachedConfig = (config, cacheDir) => {
  const { base } = config;
  const modelUrl = {
    load: async () => loadCachedModel({
      url: `https://storage.googleapis.com/tfjs-models/savedmodel/ssd_${base}`,
      cacheDir: path.resolve(cacheDir, `coco-ssd-${base}`)
    })
  }

  return {...config, ...{modelUrl} };
}

export const downloadModel = async(config, cacheDir) => {
  const cachedConfig = toCachedConfig(config, cacheDir)
  await cachedConfig.modelUrl.load();
}

export const init = async (config, cacheDir) => {
  const cachedConfig = toCachedConfig(config, cacheDir);
  const model = await cocoSsd.load(cachedConfig);

  const detect = async (input, { maxNumBoxes, minScore } = {}) => {
    maxNumBoxes = maxNumBoxes || 20;
    minScore = minScore || .1
    return model.detect(input, maxNumBoxes, minScore);
  }

  return { config, model, detect }
}
