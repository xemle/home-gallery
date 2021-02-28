const express = require('express');
const morgan = require('morgan');

const server = async ({port}) => {
  const app = express();

  app.set('x-powered-by', false);
  app.use(morgan('dev'));

  return new Promise(resolve => {
    let server;

    const shutDown = () => {
      console.log(`Stopping server`)
      server?.close(() => {
        process.exit(0);
      })
    }

    process.on('SIGTERM', shutDown);
    process.on('SIGINT', shutDown);

    server = app.listen(port, () => {
      console.log(`Listen on port http://localhost:${port}`);
      resolve(app);
    });
  });
}

module.exports = server;
