const fs = require('fs');
const archiver = require('archiver');
const debug = require('debug')('export:archive');

const zipOpitons = {
  zlib: {
    level: 9
  }
}

const tarOptions = {
  gzip: true
}

const toHuman = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  while (bytes > 786 && unitIndex < units.length) {
    bytes = bytes / 1024;
    unitIndex++;
  }
  if (unitIndex === 0) {
    return `${bytes}${units[unitIndex]}`
  } else {
    return `${bytes.toFixed(1)}${units[unitIndex]}`
  }
}

const createArchive = (outputDirectory, archiveFilename, cb) => {
  if (!archiveFilename) {
    return cb(null, outputDirectory, archiveFilename);
  }

  const match = archiveFilename.match(/\.(zip|tar\.gz)$/i);
  if (!match) {
    const err = new Error(`Archive filename ${archiveFilename} must end with .zip or .tar.gz`);
    debug(err.message);
    cb(err)
  }
  const isZip = 'zip' === match[1];
  const format = isZip ? 'zip' : 'tar'
  const options = isZip ? zipOpitons : tarOptions

  const t0 = Date.now();
  debug(`Creating archive ${archiveFilename}`);

  const output = fs.createWriteStream(archiveFilename);
  const archive = archiver(format, options);

  output.on('close', () => {
    debug(`Created archive ${archiveFilename} with ${toHuman(archive.pointer())} in ${Date.now() - t0}ms`);
    return cb(null, outputDirectory, archiveFilename);
  });

  archive.on('error', (err) => {
    debug(`Failed to create archive ${archiveFilename}: ${err}`)
    cb(err);
  });

  archive.pipe(output);

  archive.directory(`${outputDirectory}/`, false);

  archive.finalize();
}

module.exports = createArchive;