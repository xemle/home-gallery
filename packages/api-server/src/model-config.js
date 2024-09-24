import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export const modelDir = process.env.MODEL_DIR || path.resolve(__dirname, '../models')

export const getModelConfig = async () => {
  const faceApiPackageDir = await findPackage('@vladmandic/face-api')
  const faceApiModelDir = process.env.FACE_API_MODEL_DIR || path.resolve(faceApiPackageDir, 'model')

  return {
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
}

const findPackage = async (packageName, dir = __dirname) => {
  const packageDir = path.resolve(dir, 'node_modules', packageName)
  const exists = await fs.access(path.resolve(packageDir, 'package.json')).then(() => true, () => false)
  if (exists) {
    return path.resolve(packageDir)
  }

  const parent = path.dirname(dir)
  if (parent && parent != dir) {
    return findPackage(packageName, parent)
  }
  throw new Error(`Could not find package ${packageName}`)
}
