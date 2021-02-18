const server = require('./src/server');
const loadTensorflow = require('./src/load-tensorflow');
const Embeddings = require('./src/embeddings');
const ObjectDetection = require('./src/object-detection');

const isMimeMiddleware = require('./src/is-mime-middleware');
const binaryBodyMiddleware = require('./src/binary-body-middleware');
const embeddingsMiddleware = require('./src/embeddings-middleware');
const objectDetectionMiddleware = require('./src/object-detection-middleware');

const run = async () => {
  const port = process.env.PORT || 3000;
  const useCpuBackend = process.env.TFJS_CPU || false
  const maxBytes = 2 * 1024 * 1024; // 2 MB;

  const { decodeJpeg } = await loadTensorflow(useCpuBackend)
  const embeddings = await Embeddings(decodeJpeg);
  const objectDetection = await ObjectDetection(decodeJpeg);

  const app = await server({port});

  app.post('/embeddings', [
    isMimeMiddleware('image/jpeg'),
    binaryBodyMiddleware(maxBytes),
    embeddingsMiddleware(embeddings)
  ]);
  app.post('/object-detection', [
    isMimeMiddleware('image/jpeg'),
    binaryBodyMiddleware(maxBytes),
    objectDetectionMiddleware(objectDetection)
  ]);
}

run();
