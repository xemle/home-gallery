const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const async = require('async');
const walk = require('./walker');
const debug = require('debug')('core');

const args = process.argv.slice(2);

const options = {
  dir: path.resolve(args[0] || '.'),
  indexFilename: 'fs.index'
}

while (args.length) {
  const arg = args.shift();
  if (arg === '-d') {
    const param = args.shift();
    options.dir = path.resolve(param)
  }
  if (arg === '-i') {
    const param = args.shift();
    options.indexFilename = path.resolve(param);
  }
}

const readIndex = (filename, cb) => {
  const t0 = Date.now();
  fs.readFile(filename, (err, buffer) => {
    if (err) {
      if (err.code === 'ENOENT') {
        debug(`Index file ${filename} does not exists`)
        return cb(null, { entries: {} });
      }
      debug(`Could not read index file ${filename}: ${err}`)
      return cb(err);
    }
    zlib.gunzip(buffer, function (err, data) {
      if (err) {
        debug(`Could not decompress index file ${filename}: ${err}`)
        return cb(err);
      }
  
      try {
        const index = JSON.parse(data.toString('utf8'));
        debug(`Read index file ${filename} with ${Object.keys(index.entries).length} entries in ${Date.now() - t0}ms`);
        cb(null, index);
      } catch (e) {
        debug(`Could not parse index file ${filename}: ${e}`)
        cb(new Error(e));
      }
    })
  })
}

const createIndex = (dir, cb) => {
  const entries = {};
  const t0 = Date.now();
  walk(dir, (filename, stat) => {
    entries[filename] = Object.assign({}, stat, {
      filename: filename,
      sha1sum: '',
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymbolicLink: stat.isSymbolicLink(),
      isOther: !stat.isFile() && !stat.isDirectory() && !stat.isSymbolicLink(),
      fileType: stat.isDirectory() ? 'd' : (stat.isFile() ? 'f' : (stat.isSymbolicLink() ? 'l' : 'o'))
    });
    return true;
  }, (err) => {
    if (err) {
      debug(`Could not read files in ${dir}: ${err}`);
      return cb(err);
    } 
    debug(`Read ${Object.keys(entries).length} files in ${dir} in ${Date.now() - t0}ms`);
    cb(null, entries);
  });
}

const matchEntry = (fileEntry, fsEntry) => {
  if (fileEntry.size === fsEntry.size &&
    fileEntry.ino === fsEntry.ino &&
    fileEntry.dev === fsEntry.dev &&
    fileEntry.ctime === fsEntry.ctime.toISOString() &&
    fileEntry.fileType === fsEntry.fileType) {
    return true
  }
  return false;
}

const mergeIndex = (fileEntryMap, fsEntryMap, commonKeys) => {
  let changedKeys = [];
  
  const commonEntries = commonKeys.map(key => {
    const fileEntry = fileEntryMap[key];
    const fsEntry = fsEntryMap[key];

    if (matchEntry(fileEntry, fsEntry)) {
      return fileEntry;
    } else {
      changedKeys.push(key);
      return fsEntry;
    }
  })
  
  const commonEntryMap = commonEntries.reduce((entryMap, entry) => {
    entryMap[entry.filename] = entry;
    return entryMap;
  }, {});

  return {commonEntryMap, changedKeys};
}

const updateIndex = (fileEntryMap, fsEntryMap, cb) => {
  const t0 = Date.now();
  if (!Object.keys(fileEntryMap).length) {
    debug(`Initiate index with ${Object.keys(fsEntryMap).length} entries`);
    return cb(null, fsEntryMap, true);
  }
  const fileKeys = Object.keys(fileEntryMap);
  const fsKeys = Object.keys(fsEntryMap);
  const onlyFileKeys = fileKeys.filter(key => !fsEntryMap[key]);
  const onlyFsKeys = fsKeys.filter(key => !fileEntryMap[key]);
  const commonKeys = fileKeys.filter(key => fsEntryMap[key]);

  const { commonEntryMap, changedKeys } = mergeIndex(fileEntryMap, fsEntryMap, commonKeys);

  if (!onlyFileKeys.length && !onlyFsKeys.length && !changedKeys) {
    debug(`No changes found in ${Date.now() - t0}ms`);
    return cb(null, fileEntryMap, false);
  }

  const newIndexKeys = commonKeys.concat(onlyFsKeys);
  newIndexKeys.sort();

  const newEntryMap = newIndexKeys.reduce((entryMap, key) => {
    const entry = commonEntryMap[key] || fsEntryMap[key];
    entryMap[key] = entry;
    return entryMap;
  }, {})

  debug(`Index merged of ${newIndexKeys.length} entries in ${Date.now() - t0}ms. ${onlyFsKeys.length} added, ${changedKeys.length} changed, ${onlyFileKeys.length} removed`)
  debug(`Changed files:\n${changedKeys.map(f => `M ${f}`).join('\n')}`)
  cb(null, newEntryMap, true);
}

const writeIndex = (filename, index, cb) => {
  const t0 = Date.now();
  try {
    const json = JSON.stringify(index);
    const buffer = Buffer.from(json, 'utf-8');
    zlib.gzip(buffer, (err, result) => {
      if (err) {
        debug(`Could not compress index file ${filename}: ${err}`);
        return cb(err);
      }
      fs.writeFile(filename, result, (err) => {
        if (err) {
          debug(`Could not write index file ${filename}: ${err}`);
          return cb(err);
        }
        debug(`Write index file ${filename} with ${Object.keys(index.entries).length} entries in ${Date.now() - t0}ms`);
        cb(null, index);
      });
    });
  } catch (e) {
    debug(`Could not write index file ${filename}: ${e}`);
    cb(new Error(e));
  }
}

const now = new Date();
async.waterfall([
  (callback) => readIndex(options.indexFilename, callback),
  (fileIndex, callback) => {
    createIndex(options.dir, (err, fsEntries) => {
      if (err) {
        return callback(err);
      }
      updateIndex(fileIndex.entries, fsEntries, (err, entries, changed) => {
        if (err) {
          return callback(err);
        }
        callback(null, fileIndex, entries, changed);
      })
    })
  },
  (fileIndex, entries, changed, callback) => {
    if (changed) {
      writeIndex(options.indexFilename, {
        type: 'fileindex',
        version: 1,
        created: now.toISOString(),
        entries
      }, callback)
    } else {
      callback(null, fileIndex);
    }
  }
], (err, fileIndex) => {
  if (!err) {
    debug(`Successfully updated file index`);
  }
})