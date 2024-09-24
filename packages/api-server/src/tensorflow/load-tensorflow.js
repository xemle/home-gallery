export const loadTensorflow = async (backend) => {
  let tf;
  if (backend == 'node') {
    tf = await import('@tensorflow/tfjs-node');
  } else {
    await import('@tensorflow/tfjs-backend-wasm');
    await import('@tensorflow/tfjs-backend-cpu');
    tf = await import('@tensorflow/tfjs');
    await tf.setBackend(backend);
  }
  await tf.ready()
  return tf;
}
