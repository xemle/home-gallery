const path = require('path');

const nodeModulesDir = process.env.NODE_MODULES_DIR || path.resolve(__dirname, '../node_modules')
const faceApiModelDir = process.env.FACE_API_MODEL_DIR || path.resolve(nodeModulesDir, '@vladmandic/face-api/model')
const modelDir = process.env.MODEL_DIR || path.resolve(__dirname, '../models')

const modelConfig = {
  mobileNet: {
    version: 1, 
    alpha: 1.0
  },
  cocoSsd: {
    base: 'mobilenet_v2'
  },
  faceApi: {
    modelPath: faceApiModelDir,
    minScore: 0.1,
    maxResults: 10
  }
}

module.exports = { modelConfig, modelDir};
