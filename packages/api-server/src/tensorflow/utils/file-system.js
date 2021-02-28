const fs = require('fs').promises;
const path = require('path');

const { toArrayBuffer } = require('./io-utils');

// source https://github.com/tensorflow/tfjs/blob/73a09c2357aeb2c258f7d6a52eecb341d40c9939/tfjs-node/src/io/file_system.ts
const loadJSONModel = async (modelPath) => {
  console.log(`Loading model from ${modelPath}`);
  const data = await fs.readFile(modelPath, 'utf-8');
  const modelJSON = JSON.parse(data);

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
      const buffer = await fs.readFile(weightFilePath);
      buffers.push(buffer);
    }
    weightSpecs.push(...group.weights);
  }
  return [weightSpecs, toArrayBuffer(buffers)];
}

module.exports = { loadJSONModel } ;
