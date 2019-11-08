const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const debug = require('debug')('checksum');

const writeIndex = require('./index/write');

const createSha1 = (filename, cb) => {
  var input = fs.createReadStream(filename);
  var digest = crypto.createHash('sha1');

  input.addListener('error', cb);
  input.addListener('data', (data) => digest.update(data));
  input.addListener('close', () => {
    cb(null, digest.digest('hex'));
  });
};

const humanize = (size) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let unitIndex = 0;
  while (size > 786 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return size.toFixed(unitIndex === 0 ? 0 : 1) + units[unitIndex];
}

const checksum = (filename, index, cb) => {
  const missingChecksumEntries = index.entries.filter(e => e.isFile && !e.sha1sum);
  let interrupted = false;
  const t0 = Date.now();

  if (!missingChecksumEntries.length) {
    return cb(null, index);
  }

  const bytes = missingChecksumEntries.map(e => e.size).reduce((all, size) => { all += size; return all}, 0);
  let bytesCalculated = 0;
  debug(`Calculating checksums for ${missingChecksumEntries.length} entries (${(100 * missingChecksumEntries.length / index.entries.length).toFixed(1)}%) with total size of ${humanize(bytes)}`);

  process.on('SIGINT', () => {
    if (!interrupted) {
      console.log(`Graceful shutdown, ${(100 * bytesCalculated / bytes).toFixed(0)}% of checksums done. Please be patient to avoid data loss!`);
      interrupted = true;
      writeIndex(filename, index, cb);
    } else {
      console.log(`Shutdown in progress. Please be patient to avoid data loss!`);
    }
  });

  const calculateAll = (base, entries, done) => {
    if (!entries.length || interrupted) {
      return done();
    }
    const entry = entries.shift();
    const filename = path.join(base, entry.filename);

    createSha1(filename, (err, sha1sum) => {
      if (interrupted) {
        return;
      } else if (err) {
        done(err);
      }
      entry.sha1sum = sha1sum;
      bytesCalculated += entry.size;
      debug(`Created checksum of ${entry.filename} with ${humanize(entry.size)}`);
      calculateAll(base, entries, done);
    })
  }

  calculateAll(index.base, missingChecksumEntries, (err) => {
    if (err) {
      return cb(err);
    }
    debug(`All checksums are calculated of total file size ${humanize(bytes)} in ${Date.now() - t0}ms`);
    writeIndex(filename, index, cb);
  });

}

module.exports = checksum;
