import logger from '../utils/logger.js';

export const asyncMiddleware = fn => (req, res) => fn(req, res)
    .then(body => res.status(200).json(body))
    .catch(e => {
      logger.error(e, `Error: ${e}`);
      res.status(500).json(e);
    })

