const mcache = require('memory-cache');

function cache(duration) {
  const currentCache = new mcache.Cache();

  // credits to https://medium.com/the-node-js-collection/simple-server-side-cache-for-express-js-with-node-js-45ff296ca0f0
  const middleware = (req, res, next) => {
    let key = '__mcache__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next();
    }
  }

  const clear = () => {
    currentCache.clear();
  }

  return { middleware, clear };
}

module.exports = { cache };
