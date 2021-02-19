const fs = require('fs')
const path = require('path')

const backend = process.env.BACKEND === 'cpu' ? 'cpu' : 'wasm';
let tf;
if (backend === 'wasm') {
  require('@tensorflow/tfjs-backend-wasm');
  tf = require('@tensorflow/tfjs-core');
} else if (backend === 'cpu') {
  require('@tensorflow/tfjs-backend-cpu');
  tf = require('@tensorflow/tfjs');
}

const mobilenet = require('@tensorflow-models/mobilenet');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const readJpeg = require('./src/read-jpeg');

const decodeJpeg = data => {
  const {buffer, width, height} = readJpeg(data)
  const channels = 3;
  return tf.tensor3d(buffer, [height, width, channels]);
}

// source https://github.com/tensorflow/tfjs/blob/73a09c2357aeb2c258f7d6a52eecb341d40c9939/tfjs-node/src/io/file_system.ts
const loadJSONModel = async (modelPath) => {
  const modelJSON = JSON.parse(fs.readFileSync(modelPath, 'utf8'));

  const modelArtifacts = {
    modelTopology: modelJSON.modelTopology,
    format: modelJSON.format,
    generatedBy: modelJSON.generatedBy,
    convertedBy: modelJSON.convertedBy
  };
  if (modelJSON.weightsManifest != null) {
    const [weightSpecs, weightData] = await loadWeights(modelJSON.weightsManifest, modelPath);
    modelArtifacts.weightSpecs = weightSpecs;
    modelArtifacts.weightData = weightData;
  }
  if (modelJSON.trainingConfig != null) {
    modelArtifacts.trainingConfig = modelJSON.trainingConfig;
  }
  if (modelJSON.signature != null) {
    modelArtifacts.signature = modelJSON.signature;
  }
  if (modelJSON.userDefinedMetadata != null) {
    modelArtifacts.userDefinedMetadata = modelJSON.userDefinedMetadata;
  }
  return modelArtifacts;
}

const loadWeights = async (weightsManifest, modelPath) => {
  const dirName = path.dirname(modelPath);
  const buffers = [];
  const weightSpecs = [];
  for (const group of weightsManifest) {
    for (const groupPath of group.paths) {
      const weightFilePath = path.join(dirName, groupPath);
      const buffer = fs.readFileSync(weightFilePath)
      buffers.push(buffer);
    }
    weightSpecs.push(...group.weights);
  }
  return [weightSpecs, toArrayBuffer(buffers)];
}

// Source https://github.com/tensorflow/tfjs/blob/73a09c2357aeb2c258f7d6a52eecb341d40c9939/tfjs-node/src/io/io_utils.ts
const toArrayBuffer = (buf) => {
  let totalLength = 0;
  for (const buffer of buf) {
    totalLength += buffer.length;
  }

  const ab = new ArrayBuffer(totalLength);
  const view = new Uint8Array(ab);
  let pos = 0;
  for (const buffer of buf) {
    pos += buffer.copy(view, pos);
  }
  return ab;
}

const run = async () => {
  const t0 = Date.now();
  await tf.setBackend(backend)
  await tf.ready()
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
  const model = await mobilenet.load(config);
  const t2 = Date.now();
  console.log(`Load mobilenet in ${t2 - t1}ms`)
  
  const data = fs.readFileSync('sample.jpg');
  const input = decodeJpeg(data);
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

  const input2 = decodeJpeg(data);
  const objects = await coco.detect(input2);
  input2.dispose();
  const t7 = Date.now();
  console.log(`Object detection in ${t7 - t6}ms`)
  console.log(objects)
  return classResult;
}

run().then(() => console.log(`done`), e => console.log(`error: ${e}`))