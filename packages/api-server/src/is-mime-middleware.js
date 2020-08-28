const isMimeMiddleware = (mimeType) => {
  return (req, res, next) => {
    if (!req.is(mimeType)) {
      const err = new Error(`Given MIME type is not acceptable. Require MIME type '${mimeType}'`);
      console.log(err.message);
      res.status(406).json({error: err.message});
    } else {
      next();
    }
  }
}

module.exports = isMimeMiddleware;
