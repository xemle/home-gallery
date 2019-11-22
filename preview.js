const heapdump = require('heapdump');
console.log(`kill -USR2 ${process.pid} to create heapdump`);

const os = require('os');
const fs = require('fs');
const path = require('path');
const async = require('async');
const sharp = require('sharp');
const debug = require('debug')('preview');

const readIndex = require('./lib/index/read');

const args = process.argv.slice(2);

const options = {
  indexFile: null,
  storageDir: null
}

function help() {
  console.log(`preview -i <index file> -s <storage dir>`);
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

function resize(src, dst, size, cb) {
  const t0 = Date.now();
  sharp(src)
    .rotate()
    .resize({width: size})
    .jpeg({quality: 80, chromaSubsampling: '4:4:4'})
    .toBuffer((err, data) => {
      if (err) {
        return cb(`Could not create JPEG buffer from ${src}: ${err}`);
      }
      fs.writeFile(dst, data, (err) => {
        if (err) {
          return cb();
        }
        debug(`Created preview ${dst} with size ${size} in ${Date.now() - t0}ms`);
        cb(null, dst);
      });
    });
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

function calculatePreview(entry, cb) {
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

    let sizes = [1920, 1280, 800, 320, 128];

    let index = 0;
    let src = filename;
    const next = () => {
      if (index === sizes.length) {
        return cb();
      }

      const size = sizes[index++];
      const filename = `${base}-preview-image-${size}.jpg`;
      const dst = path.join(dir, filename);

      if (files.indexOf(filename) >= 0) {
        src = dst;
        return next();
      }

      resize(src, dst, size, (err) => {
        if (err) {
          return cb(new Error(`Could not calculate preview from ${src} to ${dst}: ${err}`));
        } else {
          src = dst;
          return next();
        }
      });
    }

    next();
  })
}

function calculatePreviewQueue(entries, queueSize, cb) {
  if (!entries.length) {
    return cb();
  }

  const failures = [];
  let i = 0;
  let worker = 0;
  const next = () => {
    if (worker < queueSize && i < entries.length) {
      worker++;
      const entry = entries[i++];
      calculatePreview(entry, (err) => {
        worker--;
        if (err) {
          failures.push({entry, err});
        }
        next();
      });
      next();
    } else if (worker === 0 && i === entries.length) {
      cb(null, failures);
    }
  }

  next();
}

async.waterfall([
  (callback) => readIndex(options.indexFile, callback),
  (index, callback) => {
    const base = path.resolve(index.base);
    const entries = index.entries
      .filter(e => e.fileType === 'f' && e.sha1sum && e.filename.match(/\.(jpe?g|png)$/i) && !path.basename(e.filename).match(/^\._/))
      .map(e => Object.assign({}, {
        filename: e.filename,
        url: `file://${path.join(base, e.filename)}`,
        sha1sum: e.sha1sum,
        sha1sumDate: e.sha1sumDate
      }));
    callback(null, entries)
  },
  (entries, callback) => calculatePreviewQueue(entries, os.cpus().length, callback)
], (err, failures) => {
  if (err) {
    debug(`Error occured ${err}`);
  } else {
    debug(`Preview calculation done with ${failures.length} failures.`);
    if (failures.length) {
      debug(`Failures:\n${failures.map(v => `${v.entry.sha1sum}: ${v.entry.url}, ${v.err.toString().replace(/\n/g, '\\n')}`).join('\n')}`);
    }
  }
});
