const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');

const embeddings = async () => {
  const t0 = Date.now();
  const config = {
    version: 2,
    alpha: 1.0
  }
  const model = await mobilenet.load(config);
  const modelName = 'mobilenet'
  const version = `v${config.version}_${config.alpha.toFixed(1)}`;
  console.log(`Loaded model ${modelName} ${version} in ${Date.now() - t0}ms`);

  return {
    model: modelName,
    version,
    fromJpg: (buffer) => {
      const input = tf.node.decodeJpeg(buffer);
      const infer = model.infer(input, true);
      const embeddings = infer.arraySync()[0];
      infer.dispose();
      input.dispose();
      return embeddings;
    }
  }
}

module.exports = embeddings;
