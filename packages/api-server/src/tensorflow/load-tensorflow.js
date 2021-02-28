const loadTensorflow = async (backend) => {
  let tf;
  if (backend == 'node') {
    tf = require('@tensorflow/tfjs-node');
  } else {
    require('@tensorflow/tfjs-backend-wasm');
    require('@tensorflow/tfjs-backend-cpu');
    tf = require('@tensorflow/tfjs');
    await tf.setBackend(backend);
  }
  await tf.ready()
  return tf;
}

module.exports = loadTensorflow;
