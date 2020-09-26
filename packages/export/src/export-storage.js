const fs = require('fs');
const path = require('path');
const debug = require('debug')('export:storage');

const copyFile = require('./copy-file');

const exportEntry = (entry, storageDir, directory, cb) => {
  let i = 0;
  const previews = entry.previews || [];
  const next = () => {
    if (i === previews.length) {
      return cb();
    }
    const filename = previews[i++];
    copyFile(filename, storageDir, directory, (err) => {
      if (err) {
        debug(`Could not export preview file ${filename} of entry ${entryToString(entry)}. Continue`);
      }
      next();
    })
  }

  next();
}

const leadPad = (value, char, len) => {
  let s = `${value}`;
  while (s.length < len) {
    s = char + s;
  }
  return s;
}

const formatDate = () => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    leadPad(now.getMonth(), '0', 2),
    leadPad(now.getDay(), '0', 2)
  ].join('')
  const time = [
    leadPad(now.getHours(), '0', 2),
    leadPad(now.getMinutes(), '0', 2),
    leadPad(now.getSeconds(), '0', 2)
  ].join('')
  return `${date}-${time}`
}

const entryToString = entry => {
  const firstFile = entry.files[0];
  return `${entry.id.substr(7)}:${firstFile.indexName}:${firstFile.filename}`
}

const exportStorage = (database, storageDir, outputDirectory, basePath, cb) => {
  if (!outputDirectory) {
    const date = formatDate();
    outputDirectory = `home-gallery-export-${date}`
  }

  const directory = path.join(outputDirectory, basePath, 'files');
  const t0 = Date.now();
  const entries = database.data;
  let i = 0;
  const next = () => {
    if (i === entries.length) {
      debug(`Exported ${entries.length} entries in ${Date.now() - t0}ms`);
      return cb(null, database, outputDirectory, basePath);
    }

    const entry = entries[i++];
    exportEntry(entry, storageDir, directory, () => {
      if (i % 200 === 0) {
        process.nextTick(next);
      } else {
        next();
      }
    })

  }

  next();
}

module.exports = exportStorage;
