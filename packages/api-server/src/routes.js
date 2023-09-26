const isMimeMiddleware = require('./server/is-mime-middleware');
const binaryBodyMiddleware = require('./server/binary-body-middleware');
const asyncMiddleware = require('./server/async-middleware');
const readJpeg = require('./utils/read-jpeg');
const toSha1 = require('./utils/sha1');

const t0 = Date.now()
const routes = (app, maxBytes, modelConfig, embeddings, objects, faces) => {
  app.get('/health', (_, res) => {
    res.send({health: 'OK', uptime: Date.now() - t0})
  })
  app.post('/embeddings', [
    isMimeMiddleware('image/jpeg'),
    binaryBodyMiddleware(maxBytes),
    asyncMiddleware(async (req) => {
      const {buffer, width, height} = readJpeg(req.body)
      const srcSha1sum = toSha1(req.body);
      const created = new Date().toISOString();
      const data = await embeddings(buffer, width, height)
      const alpha = modelConfig.mobileNet.alpha;
      const version = `v${modelConfig.mobileNet.version}_${alpha >= 1 ? alpha.toFixed(1) : alpha.toFixed(2)}`;
      return { srcSha1sum, model: 'mobilenet', version, created, data };
    })
  ]);
  app.post('/objects', [
    isMimeMiddleware('image/jpeg'),
    binaryBodyMiddleware(maxBytes),
    asyncMiddleware(async (req) => {
      const {buffer, width, height} = readJpeg(req.body)
      const srcSha1sum = toSha1(req.body);
      const created = new Date().toISOString();
      const data = await objects(buffer, width, height)
      return { srcSha1sum, model: 'cocossd', version: `${modelConfig.cocoSsd.base}`, created, width, height, data };
    })
  ]);
  app.post('/faces', [
    isMimeMiddleware('image/jpeg'),
    binaryBodyMiddleware(maxBytes),
    asyncMiddleware(async (req) => {
      const {buffer, width, height} = readJpeg(req.body)
      const srcSha1sum = toSha1(req.body);
      const created = new Date().toISOString();
      const data = await faces(buffer, width, height)
      return { srcSha1sum, model: 'face-api', created, width, height, data };
    })
  ])
}

module.exports = routes;
