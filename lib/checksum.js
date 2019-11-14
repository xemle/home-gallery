const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const debug = require('debug')('checksum');

const createSha1 = (filename, cb) => {
  var input = fs.createReadStream(filename);
  var digest = crypto.createHash('sha1');

  const destroyStream = () => {
    input.destroy();
  }
  process.on('SIGINT', destroyStream)

  input.addListener('error', cb);
  input.addListener('data', (data) => digest.update(data));
  input.addListener('close', () => {
    process.off('SIGINT', destroyStream);
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

const checksum = (index, sha1sumDate, cb) => {
  const missingChecksumEntries = index.entries.filter(e => e.isFile && !e.sha1sum);
  let interrupted = false;
  const t0 = Date.now();

  if (!missingChecksumEntries.length) {
    return cb(null, index);
  }

  const totalBytes = index.entries.reduce((all, entry) => { all += entry.size; return all}, 0);
  const bytes = missingChecksumEntries.reduce((all, entry) => { all += entry.size; return all}, 0);
  let bytesCalculated = 0;
  debug(`Calculating checksums for ${missingChecksumEntries.length} entries with ${humanize(bytes)} of total size ${humanize(totalBytes)} (${(100 * bytes / totalBytes).toFixed(1)}%)`);

  const gracefulShutdown = () => {
    if (!interrupted) {
      console.log(`Graceful shutdown. Checksums of ${humanize(bytesCalculated)} (${(100 * bytesCalculated / bytes).toFixed(1)}%) were calculated, ${(100 * (totalBytes - bytes + bytesCalculated) / totalBytes).toFixed(0)}% of ${humanize(totalBytes)} are done. Please be patient to avoid data loss!`);
      interrupted = true;
      cb(null, index);
    } else {
      console.log(`Shutdown in progress. Please be patient to avoid data loss!`);
    }
  };
  process.on('SIGINT', gracefulShutdown);

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
      entry.sha1sumDate = sha1sumDate;

      bytesCalculated += entry.size;
      debug(`Created checksum of ${entry.filename} with ${humanize(entry.size)}`);
      calculateAll(base, entries, done);
    })
  }

  calculateAll(index.base, missingChecksumEntries, (err) => {
    process.off('SIGINT', gracefulShutdown);
    if (err) {
      return cb(err);
    }
    debug(`All checksums of ${humanize(totalBytes)} are calculated. Calculated checksums of ${humanize(bytesCalculated)} (${(100 * bytesCalculated / totalBytes).toFixed(1)}%) in ${Date.now() - t0}ms`);
    cb(null, index);
  });
}

module.exports = checksum;
