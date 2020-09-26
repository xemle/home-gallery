const fs = require('fs');
const path = require('path');
const debug = require('debug')('export:storage');

const { mkdir } = require('@home-gallery/common')

const copyFile = (src, dst, size, cb) => {
  fs.copyFile(src, dst, (err) => {
    if (err) {
      debug(`Copy of ${src} to ${dst} failed: ${err}`);
      return cb(err);
    }
    cb();
  })
}

const shouldOverwrite = (srcStats, dstStats) => {
  return srcStats.size != dstStats.size;
}

const exportStorageFile = (filename, storageDir, outputDirectory, cb) => {
  const src = path.join(storageDir, filename);
  const dst = path.join(outputDirectory, 'files', filename);
  
  fs.stat(src, (err, srcStats) => {
    if (err && err.code === 'ENOENT') {
      return cb(new Error(`Source file ${src} is missing`))
    } else if (err) {
      return cb(new Error(`Could not get file stats of ${src}`));
    }

    fs.stat(dst, (err, dstStats) => {
      if (err && err.code === 'ENOENT') {
        const dstDir = path.dirname(dst)
        return mkdir(dstDir, (err) => {
          if (err) {
            debug(`Could not create directory ${path.relative(dstDir, outputDirectory)} in ${outputDirectory}: ${err}`);
            return cb(err);
          }
          copyFile(src, dst, srcStats.size, cb);
        })
      } else if (err) {
        debug(`File stat failed of ${filename} in ${outputDirectory}: ${err}`);
        return cb(err);
      }

      if (shouldOverwrite(srcStats, dstStats)) {
        debug(`Overwrite ${filename}`);
        copyFile(src, dst, srcStats.size, cb);
      } else {
        cb();
      }
    })
  })
}

const exportEntry = (entry, storageDir, directory, cb) => {
  let i = 0;
  const previews = entry.previews || [];
  const next = () => {
    if (i === previews.length) {
      return cb();
    }
    const filename = previews[i++];
    exportStorageFile(filename, storageDir, directory, (err) => {
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

  const directory = path.join(outputDirectory, basePath);
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
