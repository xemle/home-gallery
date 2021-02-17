const mobilenet = require('@tensorflow-models/mobilenet');

const initTensorflow = async (useCpuBackend) => {
  const t0 = Date.now();
  if (useCpuBackend) {
    const tf = require('@tensorflow/tfjs');
    const readJpeg = require('./read-jpeg');
    require('@tensorflow/tfjs-backend-cpu');
    await tf.setBackend('cpu');
    console.log(`Init tensorflow with CPU backend in ${Date.now() - t0}ms`);


    const decodeJpeg = data => {
      const {buffer, width, height} = readJpeg(data)
      const channels = 3;
      return tf.tensor3d(buffer, [height, width, channels]);
    }

    return { tf, decodeJpeg }
  } else {
    const tf = require('@tensorflow/tfjs-node');
    console.log(`Init tensorflow with node backend in ${Date.now() - t0}ms`);
    return { tf, decodeJpeg: tf.node.decodeJpeg }
  }
}

const embeddings = async (useCpuBackend) => {
  const { decodeJpeg } = await initTensorflow(useCpuBackend)

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
