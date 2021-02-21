const fs = require('fs').promises
const path = require('path');

const { loadJSONModel } = require('./src/tensorflow/file-system');
const readJpeg = require('./src/read-jpeg');

const backends = ['cpu', 'wasm', 'node']
const backend = backends.indexOf(process.env.BACKEND) >= 0 ? process.env.BACKEND : 'wasm';

const loadTensorflow = require('./src/tensorflow/load-tensorflow');

const mobilenet = require('@tensorflow-models/mobilenet');
const cocoSsd = require('@tensorflow-models/coco-ssd');

const decodeJpeg = (tf, data) => {
  const {buffer, width, height} = readJpeg(data)
  console.log(`decodeJpeg: ${width}x${height}`)
  const channels = 3;
  return tf.tensor3d(buffer, [height, width, channels]);
}

const run = async () => {
  const t0 = Date.now();
  const tf = await loadTensorflow(backend);
  const t1 = Date.now();
  console.log(`Set ${backend} backend in ${t1 - t0}ms`)
  const config = {
    version: 1,
    alpha: 1.0,
    //modelUrl: `http://127.0.0.1:8081/mobilenet/model.json`
    modelUrl: {
      load: async () => loadJSONModel('models/mobilenet/model.json')
    }
  }

  const faceapi = require('@vladmandic/face-api');
  faceapi.tf.setBackend(backend);
  const modelPath = path.join(__dirname, 'node_modules/@vladmandic/face-api/model');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.faceExpressionNet.loadFromDisk(modelPath);
  const minScore = 0.1;
  const maxResults = 5;
  const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });

  async function image(buffer) {
    const decoded = decodeJpeg(tf, buffer);
    const casted = decoded.toFloat();
    const result = casted.expandDims(0);
    decoded.dispose();
    casted.dispose();
    return result;
  }
  
  async function detect(tensor) {
    const result = await faceapi
      .detectAllFaces(tensor, optionsSSDMobileNet)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors()
      .withAgeAndGender();
    return result;
  }  

  const buffer = await fs.readFile('./sample-2.jpg');
  console.log(`file read`);
  const tensor = await image(buffer);
  console.log(`Tensor created`);
  const faceApiResult = await detect(tensor);
  console.log(faceApiResult);

  const model = await mobilenet.load(config);
  const t2 = Date.now();
  console.log(`Load mobilenet in ${t2 - t1}ms`)
  
  const data = await fs.readFile('sample.jpg');
  const input = decodeJpeg(tf, data);
  const t3 = Date.now();
  const classResult = await model.classify(input);
  const t4 = Date.now();
  console.log(`Classify in ${t4 - t3}ms`)
  input.dispose();
  console.log(classResult);

  const t5 = Date.now();
  const cocoConfig = {
    base: 'mobilenet_v2',
    modelUrl: {
      load: async () => loadJSONModel('models/coco-ssd/model.json')
    }
  }
  const coco = await cocoSsd.load(cocoConfig)
  const t6 = Date.now();
  console.log(`Load cocossd in ${t6 - t5}ms`)

  const input2 = decodeJpeg(tf, data);
  const objects = await coco.detect(input2);
  input2.dispose();
  const t7 = Date.now();
  console.log(`Object detection in ${t7 - t6}ms`)
  console.log(objects)
  return classResult;
}

run().then(() => console.log(`done`), e => console.log(`error: ${e}`))
