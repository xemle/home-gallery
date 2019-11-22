const startServer = require('./lib/server/index');

const args = process.argv.slice(2);

const options = {
  catalogFilename: 'catalog.db',
  storageDir: '.',
  port: 3000
}

while (args.length) {
  const arg = args.shift();
  if (arg === '-c') {
    options.catalogFilename = args.shift();
  } else if (arg === '-s') {
    options.storageDir = args.shift();
  } else if (arg === '-p') {
    options.port = +args.shift();
  }
}

startServer(options.catalogFilename, options.storageDir, options.port, () => {});