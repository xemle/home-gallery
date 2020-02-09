const fs = require('fs');
const path = require('path');
const through2 = require('through2');
const debug = require('debug')('extract:meta');

const { readDir } = require('../utils/readdir');
const getStoragePaths = require('./storage-path');
const getMetaKeyName = require('./meta-file-key');

function readJsonFile(storageDir, filename, cb) {
  fs.readFile(path.join(storageDir, filename), {encoding: 'utf8'}, (err, buf) => {
    if (err) {
      return cb(err);
    }
    let json;
    try {
      json = JSON.parse(buf.toString());
      cb(null, json);
    } catch(e) {
      debug(`Could not parse ${filename}: ${buf.toString()}. Error: ${e}. Contine`);
      return cb(e);
    }
  })
}

function readJsonFiles(storageDir, filenames, cb) {
  let meta = {};
  let remaining = filenames.length;

  if (!remaining) {
    return cb(null, meta);
  }

  filenames.forEach(filename => {
    readJsonFile(storageDir, filename, (err, json) => {
      if (!err) {
        const name = getMetaKeyName(filename);
        meta[name] = json;
      }
      remaining--;
      if (!remaining) {
        cb(null, meta)
      }
    })
  })
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

      readJsonFiles(storageDir, jsonFiles, (err, meta) => {
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
