import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('index.stat');

import { readIndex } from './read.js';
import { fileTypes } from '@home-gallery/common';

export function statIndex(indexFilename, cb) {
  let stats = {
    header: null,
    entries: 0,
    directories: 0,
    files: 0,
    symbolicLinks: 0,
    others: 0,
    totalSize: 0,
    fileTypes: {},
    extensions: [],
    unknownExtensions: [],
  }

  const incFileType = (entry, type) => {
    if (stats.fileTypes[type]) {
      stats.fileTypes[type].count++;
      stats.fileTypes[type].size += entry.size;
    } else {
      stats.fileTypes[type] = {
        count: 1, size: entry.size
      };
    }
  }

  const countEntry = (entry) => {
    stats.entries++;
    if (entry.fileType === 'd') {
      stats.directories++;
    } else if (entry.fileType === 'l') {
      stats.symbolicLinks++;
    } else if (entry.fileType === 'f') {
      stats.files++;
      stats.totalSize += entry.size;
      const basename = path.basename(entry.filename);
      const parts = basename.match(/(.+)\.([^.]+)$/);
      
      if (parts) {
        const ext = parts[2].toLowerCase();
        if (stats.extensions.indexOf(ext) < 0) {
          stats.extensions.push(ext);
        }

        let found = false;

        Object.keys(fileTypes).forEach(type => {
          if (fileTypes[type].indexOf(ext) < 0) {
            return;
          }
          found = true;
          incFileType(entry, type);
        })
        if (!found) {
          if (stats.unknownExtensions.indexOf(ext) < 0) {
            stats.unknownExtensions.push(ext);
          }
          incFileType(entry, 'unknown');
        }
      }
    } else {
      stats.others++;
    }
  }

  const t0 = Date.now();
  readIndex(indexFilename, (err, index) => {
    if (err) {
      log.error(`Failed to read index file ${indexFilename}: ${err}`);
      return cb(err);
    } 
    index.data.forEach(countEntry)
    log.info(t0, `Read stats of ${indexFilename}`);
    stats.extensions.sort();
    stats.unknownExtensions.sort();
    cb(null, stats);
  })
}
