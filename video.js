const fs = require('fs');
const path = require('path');
const async = require('async');
const hbjs = require('handbrake-js');
const debug = require('debug')('video');

const readIndex = require('./lib/index/read');

const args = process.argv.slice(2);

const options = {
  indexFile: null,
  storageDir: null
}

function help() {
  console.log(`video -i <index file> -s <storage dir>`);
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

function convertVideo(entry, cb) {
  const match = entry.url.match(/^(\w+):\/\/(.*)$/);
  if (!match || match[1] !== 'file') {
    return cb(new Error(`Unknown protocol ${match} of url ${entry.url} for entry filename ${entry.filename}`));
  }
  const origFilename = match[2];
  const dir = path.join(entry.sha1sum.substr(0, 2), entry.sha1sum.substr(2, 2));
  const base = entry.sha1sum.substr(4);

  readDir(path.join(options.storageDir, dir), (err, files) => {
    if (err) {
      return cb(err);
    }

    const outFilename = `${base}-video-preview-720.mp4`;
    const storageFilename = path.join(options.storageDir, dir, outFilename);
    if (files.indexOf(outFilename) >= 0) {
      return cb();
    } else {
      const t0 = Date.now();
      let done = false;
      const doneHandler = (err) => {
        if (done) {
          return;
        }
        done = true;
        if (err) {
          debug(`Could not convert video ${origFilename}: ${err}. Continue.`);
          cb();
        }
      }
      debug(`Starting video conversion from ${entry.filename}:${entry.sha1sum}`);
      hbjs.spawn({ 
        input: origFilename, 
        output: storageFilename,
        preset: 'Universal',
      })
      .on('end', () => {
        if (!done) {
          done = true;
          debug(`Converted video from ${entry.filename}: ${path.join(dir, outFilename)} and took ${Date.now() - t0}ms`);
          cb();
        }
      })
      .on('err', doneHandler)
      .on('error', doneHandler)
      .on('complete', doneHandler)
      .on('cancel', doneHandler)
    }
  })
}

function convertVideoQueue(entries, queueSize, cb) {
  if (!entries.length) {
    return cb();
  }

  let i = 0;
  let worker = 0;
  const next = () => {
    if (worker < queueSize && i < entries.length) {
      worker++;
      const entry = entries[i++];
      convertVideo(entry, (err) => {
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

async.waterfall([
  (callback) => readIndex(options.indexFile, callback),
  (index, callback) => {
    const base = path.resolve(index.base);
    const entries = index.entries
      .filter(e => e.fileType === 'f' && e.sha1sum && e.filename.match(/\.(avi|mp4|mov|mpe?g|mjpeg|mts)$/i))
      .map(e => Object.assign({}, {
        filename: e.filename,
        url: `file://${path.join(base, e.filename)}`,
        sha1sum: e.sha1sum,
        sha1sumDate: e.sha1sumDate
      }));
    callback(null, entries)
  },
  (entries, callback) => convertVideoQueue(entries, 4, callback)
], (err) => {
  if (err) {
    debug(`Error occured ${err}`);
  } else {
    debug('Video conversion done.');
  }
});
