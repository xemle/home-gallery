const toSha1 = require('./sha1');

const embeddingsMiddleware = (embeddings) => {
  const { model, version } = embeddings;

  return (req, res) => {
    new Promise((resolve, reject) => {
      try {
        const data = embeddings.fromJpg(req.body);
        const srcSha1sum = toSha1(req.body);
        const created = new Date().toISOString();
        body = { srcSha1sum, model, version, created, data };
        resolve(body);
      } catch (e) {
        reject(e);
      }
    })
    .then(body => res.status(200).json(body))
    .catch(e => res.status(500).json(e))
  }
}

module.exports = embeddingsMiddleware;
