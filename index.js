const path = require('path');
const async = require('async');
const debug = require('debug')('core');

const fileIndex = require('./lib/file-index');
const writeIndex = require('./lib/index/write');
const checksum = require('./lib/checksum');

const args = process.argv.slice(2);

const options = {
  base: '.',
  indexFilename: 'fs.index',
  checksum: false
}

while (args.length) {
  const arg = args.shift();
  if (arg === '-d' || arg === '--directory') {
    const param = args.shift();
    options.base = path.resolve(param)
  } else if (arg === '-i' || arg === '--index') {
    const param = args.shift();
    options.indexFilename = path.resolve(param);
  } else if (arg === '-c' || arg === '--checksum') {
    debug(`Enable checksum calculation`);
    options.checksum = true;
  } else if (arg === '-h' || arg === '--help') {
    console.log(`-d|--directory <directory> -i|--index <file index> [-c|--checksum]`);
    process.exit(0);
  }
}

const t0 = Date.now();
async.waterfall([
  (callback) => fileIndex(options.base, options.indexFilename, callback),
  (index, callback) => {
    if (options.checksum) {
      return checksum(index, (err, index) => {
        if (err) {
          return callback(err);
        }
        writeIndex(options.indexFilename, index, callback);
      })
    } else {
      return callback(null, index);
    }
  }
], (err) => {
  if (!err) {
    debug(`Successfully updated file index in ${Date.now() - t0}ms`);
  }
});
