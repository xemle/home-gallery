import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export const getPluginFiles = () => {
  return [
    path.resolve(__dirname, 'extract/meta/meta-extrator.js'),
    path.resolve(__dirname, 'extract/image/image-resizer.js'),
    path.resolve(__dirname, 'extract/image/heic-preview.js'),
    path.resolve(__dirname, 'extract/image/embedded-raw-preview.js'),
    path.resolve(__dirname, 'extract/image/image-preview.js'),
    path.resolve(__dirname, 'extract/video/video-frame-extractor.js'),
    path.resolve(__dirname, 'extract/video/video-poster.js'),
    path.resolve(__dirname, 'extract/image/vibrant.js'),
    path.resolve(__dirname, 'extract/meta/geo-reverse.js'),
    path.resolve(__dirname, 'extract/image/api-server.js'),
    path.resolve(__dirname, 'extract/video/video.js'),
  ]
}