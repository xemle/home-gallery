const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const async = require('async');
const debug = require('debug')('core');

const fileIndex = require('./lib/file-index');
const writeIndex = require('./lib/index/write');

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
async.waterfall([
  (callback) => fileIndex(options.base, options.indexFilename, callback),
  (index, callback) => {
    const missingSha1Entries = index.entries.filter(e => e.isFile && !e.sha1sum);
    let interrupted = false;
    const t0 = Date.now();

    if (!missingSha1Entries.length) {
      return callback(null, index);
    }

    debug(`Calculating SHA1 from ${missingSha1Entries.length} entries`);

    process.on('SIGINT', () => {
      console.log('Graceful shutdown...');
      interrupted = true;
      writeIndex(options.indexFilename, index, callback);
    });

    const calculate = (entries, done) => {
      if (!entries.length || interrupted) {
        return done();
      }
      const entry = entries.shift();
      const filename = path.join(options.base, entry.filename);

      var input = fs.createReadStream(filename);
      var digest = crypto.createHash('sha1');

      input.addListener('error', done);
      input.addListener('data', (data) => digest.update(data));
      input.addListener('close', () => {
        entry.sha1sum = digest.digest('hex');
        debug(`Calculated SHA1 of ${entry.filename}`);
        calculate(entries, done);
      })
    }

    calculate(missingSha1Entries, (err) => {
      if (err) {
        return callback(err);
      }
      debug(`All SHA1 are calculated in ${Date.now() - t0}ms`);
      writeIndex(options.indexFilename, index, callback);
    });

  }
], (err) => {
  if (!err) {
    debug(`Successfully updated file index in ${Date.now() - t0}ms`);
  }
});
