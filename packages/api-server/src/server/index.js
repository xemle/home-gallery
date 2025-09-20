import express from 'express';

import logger from '../utils/logger.js';

import loggerMiddleware from './logger-middleware.js';

export const server = async ({port}) => {
  const app = express();

  app.set('x-powered-by', false);
  app.use(loggerMiddleware());

  return new Promise(resolve => {
    let server;

    const shutDown = () => {
      logger.debug(`Stopping server`)
      server?.close(() => {
        logger.info(`Stopped server`)
        process.exit(0);
      })
    }

    process.once('SIGTERM', shutDown);
    process.once('SIGINT', shutDown);

    server = app.listen(port, () => {
      logger.info(`Listen on port http://localhost:${port}`);
      resolve(app);
    });
  });
}
