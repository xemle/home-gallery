const path = require('path')

const faceApiPackageDir = path.dirname(require.resolve('@vladmandic/face-api/package.json'))
const faceApiModelDir = process.env.FACE_API_MODEL_DIR || path.resolve(faceApiPackageDir, 'model')
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
