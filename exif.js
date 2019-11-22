const fs = require('fs');
const path = require('path');
const async = require('async');
const ExifTool = require('exiftool-vendored').ExifTool;
const debug = require('debug')('exif');

const readIndex = require('./lib/index/read');

const args = process.argv.slice(2);

const options = {
  indexFile: null,
  storageDir: null
}

function help() {
  console.log(`exif -i <index file> -s <storage dir>`);
}

while (args.length) {
  const arg = args.shift();
  if (arg === '-i') {
    options.indexFile = args.shift();
  } else if (arg === '-s') {
    options.storageDir = path.resolve(args.shift());
  }
}

if (!options.indexFile) {
  console.log('Missing index file');
  help();
  process.exit(1);
}

if (!options.storageDir) {
  console.log('Missing storage directory');
  help();
  process.exit(1);
}

function mkdir(dir, cb) {
  fs.stat(dir, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const dirname = path.dirname(dir);
        mkdir(dirname, (err) => {
          if (err) {
            return cb(err);
          }
          fs.mkdir(dir, cb);
        });
      } else {
        cb(err);
      }
      return;
    }
    if (!stat.isDirectory()) {
      return cb(new Error(`File ${dir} already exists and it not a directory`));
    }
    cb();
  })
}

function readDir(dir, cb) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      if (err.code === 'ENOENT') {
        mkdir(dir, (err) => {
          if (err) {
            cb(err);
          } else {
            readDir(dir, cb);
          }
        })
        return;
      } else {
        cb(err);
      }
    } else {
      cb(err, files);
    }
  });
}

function extractExif(entry, cb) {
  const match = entry.url.match(/^(\w+):\/\/(.*)$/);
  if (!match || match[1] !== 'file') {
    return cb(new Error(`Unknown protocol ${match} of url ${entry.url} for entry filename ${entry.filename}`));
  }
  const filename = match[2];
  const dir = path.join(options.storageDir, entry.sha1sum.substr(0, 2), entry.sha1sum.substr(2, 2));
  const base = entry.sha1sum.substr(4);

  readDir(dir, (err, files) => {
    if (err) {
      return cb(err);
    }

    const exifFilename = `${base}-exif.json`;
    const storageFilename = path.join(dir, exifFilename);
    if (files.indexOf(exifFilename) >= 0) {
      cb();
    } else {
      exiftool.read(filename)
        .then(tags => {
          fs.writeFile(storageFilename, JSON.stringify(tags), (err) => {
            if (err) {
              return cb(err);
            }
            debug(`Extracted exif data from ${entry.filename}`);
            cb();
          })
        })
        .catch(err => {
          cb(err);
        })
    }
  })
}

function extractExifQueue(entries, queueSize, cb) {
  if (!entries.length) {
    return cb();
  }

  let i = 0;
  let worker = 0;
  const next = () => {
    if (worker < queueSize && i < entries.length) {
      worker++;
      const entry = entries[i++];
      extractExif(entry, (err) => {
        worker--;
        if (err) {
          return cb(err);
        }
        next();
      });
      next();
    } else if (worker === 0 && i === entries.length) {
      worker--;
      cb();
    }
  }

  next();
}
const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });

async.waterfall([
  (callback) => readIndex(options.indexFile, callback),
  (index, callback) => {
    const base = path.resolve(index.base);
    const entries = index.entries
      .filter(e => e.fileType === 'f' && e.sha1sum && e.filename.match(/\.(jpe?g|png|avi|mp4|mov|mwr|crw|cr2|cr3|dng|gif|xcf|mpe?g|flv|mjpeg|mts|thm|mts|bmp|psd)$/i))
      .map(e => Object.assign({}, {
        filename: e.filename,
        url: `file://${path.join(base, e.filename)}`,
        sha1sum: e.sha1sum,
        sha1sumDate: e.sha1sumDate
      }));
    callback(null, entries)
  },
  (entries, callback) => extractExifQueue(entries, 1, callback)
], (err) => {
  exiftool.end()
    .then(() => {
      if (err) {
        debug(`Error occured ${err}`);
      } else {
        debug('Exif extraction done.');
      }
    })
    .catch(err => {
      debug(`Error occured on closing exiftool: ${err}`);
    });
});
