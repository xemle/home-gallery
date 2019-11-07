const fs = require('fs');
const path = require('path');
const async = require('async');

const TYPE = 'filesystem.stats';
const VERSION = 1;

const createFsStat = (dir, cb) => {
  const now = Date.now();
  async.waterfall([
    // Read files of current dir
    (callback) => fs.readdir(dir, { encoding: 'utf-8'}, (err, files) => callback(err, files)),
    // Read file stats of every file
    (files, callback) => async.map(files.map(file => path.resolve(dir, file)), fs.stat, (err, stats) => callback(err, dir, files, stats)),
    // Enrich stats
    (dir, files, stats, callback) => callback(null, stats.map((stat, index) => {
      return Object.assign({}, stat, {
        basename: files[index],
        dirname: dir,
        isFile: stat.isFile(),
        isDir: stat.isDirectory(),
        isSymbolicLink: stat.isSymbolicLink(),
        isOther: !stat.isFile() && !stat.isDirectory() && !stat.isSymbolicLink()
      })
    })),
    // Create file map, where filename is key
    (files, callback) => callback(null, files.reduce((result, value) => { result[value.basename] = value; return result}, {})),
    // Create final object
    (fileMap, callback) => callback(null, {type: TYPE, version: VERSION, time: now, dirname: dir, files: fileMap})
  ], cb);
}
