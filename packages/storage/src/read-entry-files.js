const fs = require('fs');
const path = require('path');

const log = require('@home-gallery/logger')('storage.entryFile');

const { readDir } = require('@home-gallery/common');
const getStoragePaths = require('./storage-path');
const getMetaKeyName = require('./meta-file-key');

function readJsonFile(filename, cb) {
  fs.readFile(filename, {encoding: 'utf8'}, (err, buf) => {
    if (err) {
      return cb(err);
    }
    let json;
    try {
      json = JSON.parse(buf.toString());
    } catch(e) {
      return cb(e);
    }
    cb(null, json);
  })
}

function readJsonFiles(storageDir, filenames, cb) {
  const meta = {};
  let remaining = filenames.length;

  if (!remaining) {
    return cb(null, meta);
  }

  filenames.forEach(filename => {
    readJsonFile(path.join(storageDir, filename), (err, json) => {
      if (err) {
        log.error(`Could not parse ${filename}: Error: ${err}. Continue`);
      } else {
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

function readEntryFiles(entry, storageDir, cb) {
  const {dir, prefix} = getStoragePaths(entry.sha1sum);

  readDir(path.join(storageDir, dir), (err, files) => {
    if (err && err.code === 'ENOENT') {
      files = [];
    } else if (err) {
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
      cb(null, {files: filenames, meta});
    })
  });
}

module.exports = readEntryFiles;
