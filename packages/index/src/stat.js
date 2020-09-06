const path = require('path');
const debug = require('debug')('stat');

const readIndex = require('./read');
const { humanize, fileTypes } = require('@home-gallery/common');

function statIndex(indexFilename, cb) {
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
      debug(`Failed to read index file ${indexFilename}: ${err}`);
      return cb(err);
    } 
    index.data.forEach(countEntry)
    debug(`Read stats of ${indexFilename} in ${Date.now() - t0}ms`);
    stats.extensions.sort();
    stats.unknownExtensions.sort();
    cb(null, stats);
  })
}

function perCent(value, max) {
  return (100 * value / max).toFixed(1)
}

function spaces(count) {
  let result = '';
  while (result.length < count) {
    result += ' ';
  }
  return result;
}

// type, count (%), size (%)
function prettyPrint(stats) {
  const table = [];
  table.push(['type', 'count', '', 'size', '']);
  table.push(['directories:', stats.directories, '', '', '']);
  table.push(['files:', stats.files, '', humanize(stats.totalSize), '']);

  const types = Object.keys(stats.fileTypes);
  types.sort((a, b) => stats.fileTypes[b].size - stats.fileTypes[a].size);
  types.forEach(type => {
    const typeStat = stats.fileTypes[type];
    table.push([type, `${typeStat.count}`, `${perCent(typeStat.count, stats.files)}%`, ` ${humanize(typeStat.size)}`, `${perCent(typeStat.size, stats.totalSize)}%`])
  })
  table.push(['symbolic links:', stats.symbolicLinks, '', '', '']);
  table.push(['others:', stats.others, '', '', '']);

  const colSize = [0, 0, 0, 0, 0];
  table.forEach(row => {
    row.forEach((cell, index) => {
      colSize[index] = Math.max(cell.toString().length, colSize[index])
    })
  })

  return table.map(row => {
    return row.map((cell, index) => {
      if (index > 0) {
        return `${spaces(colSize[index] - cell.toString().length)}${cell}`;
      } else {
        return `${cell}${spaces(colSize[index] - cell.toString().length)}`;
      }
    }).join('  ');
  }).join('\n');
}

module.exports = { statIndex, prettyPrint };
