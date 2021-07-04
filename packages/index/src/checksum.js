const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const debug = require('debug')('checksum');

const { humanize } = require('@home-gallery/common');

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

const checksum = (index, sha1sumDate, cb) => {
  const missingChecksumEntries = index.data.filter(e => e.isFile && !e.sha1sum);
  let interrupted = false;
  const t0 = Date.now();

  if (!missingChecksumEntries.length) {
    return cb(null, index, false);
  }

  const totalBytes = index.data.reduce((all, entry) => { all += entry.size; return all}, 0);
  const bytes = missingChecksumEntries.reduce((all, entry) => { all += entry.size; return all}, 0);
  let bytesCalculated = 0;
  debug(`Calculating ids for ${missingChecksumEntries.length} entries with ${humanize(bytes)} of total size ${humanize(totalBytes)} (${(100 * bytes / totalBytes).toFixed(1)}%)`);

  const gracefulShutdown = () => {
    if (!interrupted) {
      console.log(`Graceful shutdown. Ids of ${humanize(bytesCalculated)} (${(100 * bytesCalculated / bytes).toFixed(1)}%) were calculated, ${(100 * (totalBytes - bytes + bytesCalculated) / totalBytes).toFixed(0)}% of ${humanize(totalBytes)} are done. Please be patient to avoid data loss!`);
      interrupted = true;
      cb(null, index, true);
    } else {
      console.log(`Shutdown in progress. Please be patient to avoid data loss!`);
    }
  };
  process.on('SIGINT', gracefulShutdown);

  const calculateAll = (base, entries, updatedEntries, done) => {
    if (!entries.length || interrupted) {
      return done(null, updatedEntries);
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
      updatedEntries.push(entry)

      bytesCalculated += entry.size;
      debug(`Calculated id ${sha1sum.substr(0, 7)}... for ${entry.filename} with ${humanize(entry.size)}`);
      calculateAll(base, entries, updatedEntries, done);
    })
  }

  calculateAll(index.base, missingChecksumEntries, [], (err, updatedEntries) => {
    process.off('SIGINT', gracefulShutdown);
    if (err) {
      return cb(err);
    }
    debug(`All ids of ${humanize(totalBytes)} are calculated. Calculated ids of ${humanize(bytesCalculated)} (${(100 * bytesCalculated / totalBytes).toFixed(1)}%) in ${Date.now() - t0}ms`);
    cb(null, index, updatedEntries);
  });
}

module.exports = checksum;
