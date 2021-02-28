const express = require('express');
const morgan = require('morgan');

const server = async ({port}) => {
  const app = express();

  app.set('x-powered-by', false);
  app.use(morgan('dev'));

  return new Promise(resolve => {
    app.listen(port, () => {
      console.log(`Listen on port http://localhost:${port}`);
      resolve(app);
    });
  });
}

module.exports = server;
