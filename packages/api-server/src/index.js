
import { server } from './server/index.js';
import { load as loadTensorflow } from './tensorflow/index.js';
import { getModelConfig, modelDir } from './model-config.js';

import { routes } from './routes.js';

const BACKENDS = ['cpu', 'wasm', 'node'];

export const run = async () => {
  const port = process.env.PORT || 3000;
  const maxBytes = process.env.MAX_BYES || 2 * 1024 * 1024; // 2 MB;

  const backend = BACKENDS.indexOf(process.env.BACKEND) >= 0 ? process.env.BACKEND : 'wasm';
  console.log(`Loading tensorflow and models`);
  const modelConfig = await getModelConfig()
  const { embeddings, objects, faces } = await loadTensorflow(backend, modelConfig, modelDir);

  console.log(`Starting server`);
  const app = await server({port});

  console.log(`Setup api routes`);
  routes(app, maxBytes, modelConfig, embeddings, objects, faces);
  return app;
}
