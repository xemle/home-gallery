const path = require('path');
const debug = require('debug')('core');

const fileIndex = require('./lib/file-index');

const args = process.argv.slice(2);

const options = {
  base: path.resolve(args[0] || '.'),
  indexFilename: 'fs.index'
}

while (args.length) {
  const arg = args.shift();
  if (arg === '-d') {
    const param = args.shift();
    options.base = path.resolve(param)
  }
  if (arg === '-i') {
    const param = args.shift();
    options.indexFilename = path.resolve(param);
  }
  if (arg === '-h' || arg === '--help') {
    console.log(`-d <directory> -i <index file>`);
    process.exit(0);
  }
}

const t0 = Date.now();
fileIndex(options.base, options.indexFilename, (err, index) => {
  if (!err) {
    debug(`Successfully updated file index in ${Date.now() - t0}ms`);
  }
});
