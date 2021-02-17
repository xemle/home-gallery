const loadTensorflow = require('./load-tensorflow');
const mobilenet = require('@tensorflow-models/mobilenet');

const embeddings = async (useCpuBackend) => {
  const { decodeJpeg } = await loadTensorflow(useCpuBackend)

  const t0 = Date.now();
  const config = {
    version: 1,
    alpha: 1.0
  }
  const model = await mobilenet.load(config);
  const modelName = 'mobilenet'
  const version = `v${config.version}_${config.alpha.toFixed(1)}`;
  console.log(`Loaded model ${modelName} ${version} in ${Date.now() - t0}ms`);

  return {
    model: modelName,
    version,
    fromJpg: (data) => {
      const input = decodeJpeg(data);
      const infer = model.infer(input, true);
      const embeddings = infer.arraySync()[0];
      infer.dispose();
      input.dispose();
      return embeddings;
    }
  }
}

module.exports = embeddings;
