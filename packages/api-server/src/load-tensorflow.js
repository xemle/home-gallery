const loadTensorflowCpu = async () => {
  const t0 = Date.now();
  const tf = require('@tensorflow/tfjs');
  const readJpeg = require('./read-jpeg');
  require('@tensorflow/tfjs-backend-cpu');
  await tf.setBackend('cpu');
  console.log(`Load tensorflow with CPU backend in ${Date.now() - t0}ms`);

  const decodeJpeg = data => {
    const {buffer, width, height} = readJpeg(data)
    const channels = 3;
    return tf.tensor3d(buffer, [height, width, channels]);
  }

  return { tf, decodeJpeg }
}

const loadTensorflowNode = async () => {
  const t0 = Date.now();
  const tf = require('@tensorflow/tfjs-node');
  console.log(`Load tensorflow with node backend in ${Date.now() - t0}ms`);
  return { tf, decodeJpeg: tf.node.decodeJpeg }
}

const loadTensorflow = async (useCpuBackend) => {
  if (useCpuBackend) {
    return loadTensorflowCpu()
  } else {
    try {
      return loadTensorflowNode()
    } catch (e) {
      console.log(`Failed to load tensorflow with node backend: ${e}. Use slower CPU backend`);
      return loadTensorflowCpu()
    }
  }
}

module.exports = loadTensorflow
