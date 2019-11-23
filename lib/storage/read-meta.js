const fs = require('fs');
const path = require('path');
const through2 = require('through2');

const { readDir } = require('../utils/readdir');
const getStoragePaths = require('./storage-path');
const getMetaKeyName = require('./meta-file-key');

function readJsons(storageDir, filenames, cb) {
  if (!filenames.length) {
    return cb(null, []);
  }
  let meta = {};

  let i = 0;
  const next = () => {
    if (i === filenames.length) {
      return cb(null, meta);
    }
    const filename = filenames[i++];
    fs.readFile(path.join(storageDir, filename), {encoding: 'utf8'}, (err, buf) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return next();
        }
        return cb(err);
      }
      let json;
      try {
        json = JSON.parse(buf.toString());
      } catch(e) {
        debug(`Could not parse ${filename}: ${buf.toString()}. Error: ${e}. Contine`);
        return next();
      }
      const name = getMetaKeyName(filename);
      meta[name] = json;
      next();
    })
  }

  next();
}

function readMeta(storageDir) {

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    const {dir, prefix} = getStoragePaths(entry.sha1sum);

    readDir(path.join(storageDir, dir), (err, files) => {
      if (err) {
        return cb(err);
      }
      const filenames = files
        .filter(file => file.startsWith(prefix))
        .map(file => path.join(dir, file));
      const jsonFiles = filenames
        .filter(file => file.match(/\.json$/));

      readJsons(storageDir, jsonFiles, (err, meta) => {
        if (err) {
          return cb(err);
        }
        entry.files = filenames;
        entry.meta = meta;
        that.push(entry);
        cb();
      })
    })
  });
}

module.exports = readMeta;