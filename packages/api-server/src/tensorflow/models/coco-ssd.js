const path = require('path');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const loadCachedModel = require('../utils/load-cached-model')

const toCachedConfig = (config, cacheDir) => {
  const { base } = config;
  const modelUrl = {
    load: async () => loadCachedModel({
      url: `https://storage.googleapis.com/tfjs-models/savedmodel/ssd_${base}`,
      cacheDir: path.join(cacheDir, `models/coco-ssd-${base}`)
    })
  }

  return {...config, ...{modelUrl} };
}

const init = async (config, cacheDir) => {
  const cachedConfig = toCachedConfig(config, cacheDir);
  const model = await cocoSsd.load(cachedConfig);

  const detect = async (input, { maxNumBoxes, minScore } = {}) => {
    maxNumBoxes = maxNumBoxes || 20;
    minScore = minScore || .1
    return model.detect(input, maxNumBoxes, minScore);
  }

  return { config, model, detect }
}

module.exports = init;
