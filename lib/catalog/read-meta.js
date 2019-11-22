const fs = require('fs');
const path = require('path');
const through2 = require('through2');

const { readDir } = require('../utils/readdir');

function getDataName(filename) {
  // filename = 'ef/84/46859742e8155726a66c308fd6b041f2c673-exif.json' => exif
  const match = path.basename(filename).match(/-(.*)\.json/);
  if (match) {
    return match[1];
  }
  return 'root';
}

function readJsons(storageDir, filenames, cb) {
  if (!filenames.length) {
    return cb(null, []);
  }
  let data = {};

  let i = 0;
  const next = () => {
    if (i === filenames.length) {
      return cb(null, data);
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
      const name = getDataName(filename);
      data[name] = json;
      next();
    })
  }

  next();
}

function readMeta(storageDir) {

  return through2.obj(function (entry, enc, cb) {
    const that = this;
    const sha1sum = entry.sha1sum;
    const dir = path.join(sha1sum.substr(0, 2), sha1sum.substr(2, 2));
    
    readDir(path.join(storageDir, dir), (err, files) => {
      if (err) {
        return cb(err);
      }
      const filenames = files.map(file => path.join(dir, file));
      const jsonFiles = filenames.filter(file => file.match(/\.json$/));
      readJsons(storageDir, jsonFiles, (err, data) => {
        if (err) {
          return cb(err);
        }
        entry.files = filenames;
        entry.data = data;
        that.push(entry);
        cb();
      })
    })
  });
}

module.exports = readMeta;