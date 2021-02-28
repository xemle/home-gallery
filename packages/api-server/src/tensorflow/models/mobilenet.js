const path = require('path');
const mobilenet = require('@tensorflow-models/mobilenet');

const loadCachedModel = require('../utils/load-cached-model')

const toCachedConfig = (config, cacheDir) => {
  if (config.modelUrl) {
    return config;
  }
  const version = config.version || 1;
  const alpha = ((config.alpha || 1.0) * 100).toFixed();

  const modelUrl = {
    load: async () => loadCachedModel({
      url: `https://tfhub.dev/google/imagenet/mobilenet_v${version}_${alpha}_224/classification/${version}`,
      cacheDir: path.resolve(cacheDir, `mobilenet-${version}-${alpha}`),
      queryParams: '?tfjs-format=file'
    })
  }

  return {...config, ...{modelUrl}};
}

const downloadModel = async(config, cacheDir) => {
  const cachedConfig = toCachedConfig(config, cacheDir)
  await cachedConfig.modelUrl.load();
}

const init = async (config, cacheDir) => {
  const cachedConfig = toCachedConfig(config, cacheDir)
  const model = await mobilenet.load(cachedConfig);

  const classify = async (input) => await model.classify(input);

  const infer = async (input) => {
    const infer = model.infer(input, true);
    const embeddings = infer.arraySync()[0];
    infer.dispose();
    return embeddings;
  }

  return { config, model, classify, infer };
}

module.exports = { init, downloadModel };
