const fs = require('fs').promises
const path = require('path');

const loadCachedModel = require('./src/tensorflow/load-cached-model');
const readJpeg = require('./src/read-jpeg');

const backends = ['cpu', 'wasm', 'node']
const backend = backends.indexOf(process.env.BACKEND) >= 0 ? process.env.BACKEND : 'wasm';

const loadTensorflow = require('./src/tensorflow/load-tensorflow');

const initFaceApi = require('./src/tensorflow/models/face-api');
const initMobileNet = require('./src/tensorflow/models/mobilenet');
const initCocoSsd = require('./src/tensorflow/models/coco-ssd');

const decodeJpeg = (tf, data) => {
  const {buffer, width, height} = readJpeg(data)
  const channels = 3;
  return tf.tensor3d(buffer, [height, width, channels]);
}

const run = async () => {
  const t0 = Date.now();
  const tf = await loadTensorflow(backend);
  const t1 = Date.now();
  console.log(`Set ${backend} backend in ${t1 - t0}ms`)

  const buffer = await fs.readFile('./sample-2.jpg');
  const input = decodeJpeg(tf, buffer);

  const mobileNetConfig = {
    version: 1,
    alpha: 1.0,
    modelUrl: {
      load: async () => loadCachedModel({
        url: 'https://tfhub.dev/google/imagenet/mobilenet_v1_100_224/classification/1',
        cacheDir: path.join(__dirname, 'models/mobilenet'),
        queryParams: '?tfjs-format=file'
      })
    }
  }
  const { classify } = await initMobileNet(mobileNetConfig);

  const modelPath = path.join(__dirname, 'node_modules/@vladmandic/face-api/model');
  const minScore = 0.1;
  const maxResults = 10;
  const { detect } = await initFaceApi(modelPath, { minScore, maxResults });

  const faceApiResult = await detect(input);
  console.log(faceApiResult);

  const t2 = Date.now();

  console.log(`Load mobilenet in ${t2 - t1}ms`)

  const t3 = Date.now();
  const classResult = await classify(input);
  const t4 = Date.now();
  console.log(`Classify in ${t4 - t3}ms`)
  console.log(classResult);

  const t5 = Date.now();
  const cocoSsdConfig = {
    base: 'mobilenet_v2',
    modelUrl: {
      load: async () => loadCachedModel({
        url: 'https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2',
        cacheDir: path.join(__dirname, 'models/coco-ssd')
      })
    }
  }

  const { detect: cocoDetect }  = await initCocoSsd(cocoSsdConfig);
  const t6 = Date.now();
  console.log(`Load cocossd in ${t6 - t5}ms`)

  const objects = await cocoDetect(input);
  input.dispose();
  const t7 = Date.now();
  console.log(`Object detection in ${t7 - t6}ms`)
  console.log(objects)
  return classResult;
}

run().then(() => console.log(`done`), e => console.log(`error: ${e}`))
