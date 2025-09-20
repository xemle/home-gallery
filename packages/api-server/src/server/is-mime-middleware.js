import logger from '../utils/logger.js';

const UNSUPPORTED_MEDIA_TYPE = 415;

export const isMimeMiddleware = (mimeType) => {
  return (req, res, next) => {
    if (!req.is(mimeType)) {
      const err = new Error(`Given MIME type is not acceptable. Require MIME type '${mimeType}'`);
      logger.error(err, err.message);
      res.status(UNSUPPORTED_MEDIA_TYPE).json({error: err.message});
    } else {
      next();
    }
  }
}
