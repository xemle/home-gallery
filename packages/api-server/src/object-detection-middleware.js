const toSha1 = require('./sha1');
const readJpeg = require('./read-jpeg');

const asyncHelper = fn => (req, res) => fn(req, res)
    .then(body => res.status(200).json(body))
    .catch(e => {
      console.log(`Error: ${e}`);
      res.status(500).json(e);
    })

const objectDetetionMiddleware = (objectDetection) => {
  const { model, version } = objectDetection;

  return asyncHelper(async (req) => {
    const imageData = req.body;
    const data = await objectDetection.fromJpg(imageData);
    const srcSha1sum = toSha1(imageData);
    const { width, height } = readJpeg(imageData);
    const created = new Date().toISOString();
    body = { srcSha1sum, model, version, created, width, height, data };
    return body;
  })
}

module.exports = objectDetetionMiddleware;
