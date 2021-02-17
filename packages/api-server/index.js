const server = require('./src/server');
const Embeddings = require('./src/embeddings');

const isMimeMiddleware = require('./src/is-mime-middleware');
const binaryBodyMiddleware = require('./src/binary-body-middleware');
const embeddingsMiddleware = require('./src/embeddings-middleware');

const run = async () => {
  const port = process.env.PORT || 3000;
  const useTensorflowCpu = process.env.TFJS_CPU || false
  const maxBytes = 2 * 1024 * 1024; // 2 MB;

  const embeddings = await Embeddings(useTensorflowCpu);
  const app = await server({port});

  app.post('/embeddings', [
    isMimeMiddleware('image/jpeg'),
    binaryBodyMiddleware(maxBytes),
    embeddingsMiddleware(embeddings)
  ]);
}

run();
