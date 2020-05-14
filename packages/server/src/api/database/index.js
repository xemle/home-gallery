const debug = require('debug')('server:api:database');

const { readWatchDatabase } = require('./read-database');
const { cache } = require('./cache-middleware');
const { sanitizeInt } = require('./sanitize');

function prepareData(data) {
  // unify media entries
  const idToEntry = data.media.reduce((result, value) => {
    if (!result[value.id]) {
      result[value.id] = value;
    }
    return result;
  }, Object.create({}));
  const entries = Object.values(idToEntry);
  entries.sort((a, b) => a.date < b.date ? 1 : -1);
  return {...data, ...{media: entries}};
}

function databaseApi(databaseFilename) {
  let catalog = { media: [] };
  const databaseCache = cache(3600);

  readWatchDatabase(databaseFilename, (err, data) => {
    if (err) {
      debug(`Could not read catalog file ${databaseFilename}: ${err}`);
    } else {
      catalog.media = prepareData(data).media;
      databaseCache.clear();
    }    
  })

  function send(req, res) {
    if (req.query.offset || req.query.limit) {
      const length = catalog.media.length;
      const offset = sanitizeInt(req.query.offset, 0, length, 0);
      const limit = sanitizeInt(req.query.limit, Math.min(10, length), length, length);
      const media = catalog.media.slice(offset, offset + limit);
      res.send(Object.assign({}, catalog, { limit, offset, media }));
    } else {
      res.send(catalog);
    }
  }
  
  return function (req, res) {
    databaseCache.middleware(req, res, function () {
      send(req, res);
    });
  }
}

module.exports = databaseApi;
