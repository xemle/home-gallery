const loadTensorflow = require('./load-tensorflow');

const initFaceApi = require('./models/face-api');
const { init: initMobileNet, downloadModel: downloadMobileNetModel } = require('./models/mobilenet');
const { init: initCocoSsd, downloadModel: downloadCocoSsdModel } = require('./models/coco-ssd');

const downloadModels = async (modelConfigs, cacheDir) => {
  await downloadMobileNetModel(modelConfigs.mobileNet, cacheDir)
  await downloadCocoSsdModel(modelConfigs.cocoSsd, cacheDir)
}

const load = async (backend, modelConfigs, modelDir) => {
  let t0 = Date.now();
  const tf = await loadTensorflow(backend);
  console.log(`Load tensorflow width ${backend} backend in ${Date.now() - t0}ms`)

  const toTensor = (buffer, width, height) => {
    const channels = 3;
    return tf.tensor3d(buffer, [height, width, channels]);
  }
  
  t0 = Date.now();
  const { infer } = await initMobileNet(modelConfigs.mobileNet, modelDir);
  console.log(`Loaded mobilenet model in ${Date.now() - t0}ms`)

  t0 = Date.now();
  const { detect: faceDetect } = await initFaceApi(modelConfigs.faceApi);
  console.log(`Loaded faceapi model in ${Date.now() - t0}ms`)

  t0 = Date.now();
  const { detect: cocoDetect }  = await initCocoSsd(modelConfigs.cocoSsd, modelDir);
  console.log(`Loaded coco ssd model in ${Date.now() - t0}ms`)

  return {
    embeddings: async (buffer, width, height) => {
      const input = toTensor(buffer, width, height);
      const embeddings = await infer(input);   
      input.dispose();
      return embeddings;
    },
    objects: async (buffer, width, height) => {
      const input = toTensor(buffer, width, height);
      const objects = await cocoDetect(input);   
      input.dispose();
      return objects;
    },
    faces: async (buffer, width, height) => {
      const input = toTensor(buffer, width, height);
      const faces = await faceDetect(input);   
      input.dispose();
      return faces;
    }
  }
}

module.exports = { load, downloadModels };
