const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const log = require('@home-gallery/logger')('index.checksum');
const { humanize } = require('@home-gallery/common');

const percent = (current, total, precision) => (100 * current / total).toFixed(precision || 1) + '%'

const bps = (bytes, startTime) => humanize(bytes / Math.max(0.001, (Date.now() - startTime) / 1000)) + '/s'

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
  log.info(`Calculating ids for ${missingChecksumEntries.length} entries with ${humanize(bytes)} of total size ${humanize(totalBytes)} (${percent(bytes, totalBytes)})`);

  const gracefulShutdown = () => {
    if (!interrupted) {
      console.warn(`Graceful shutdown. Ids of ${humanize(bytesCalculated)} (${percent(bytesCalculated, bytes)}) were calculated, ${percent(totalBytes - bytes + bytesCalculated, totalBytes)} of ${humanize(totalBytes)} are done. Please be patient to avoid data loss!`);
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

    const t0 = Date.now()
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
      log.debug({duration: Date.now() - t0, bytes: entry.size}, `Calculated id ${sha1sum.substr(0, 7)}... for ${entry.filename} with ${humanize(entry.size)} (${bps(entry.size, t0)})`);
      calculateAll(base, entries, updatedEntries, done);
    })
  }

  calculateAll(index.base, missingChecksumEntries, [], (err, updatedEntries) => {
    process.off('SIGINT', gracefulShutdown);
    if (err) {
      return cb(err);
    }
    log.info(t0, `All ids of ${humanize(totalBytes)} are calculated. Calculated ids of ${humanize(bytesCalculated)} (${(100 * bytesCalculated / totalBytes).toFixed(1)}%)`);
    cb(null, index, updatedEntries);
  });
}

module.exports = checksum;
