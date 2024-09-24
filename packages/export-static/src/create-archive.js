import fs from 'fs';
import archiver from 'archiver';

import Logger from '@home-gallery/logger'

const log = Logger('export.archive');

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

export const createArchive = (dir, archiveFile, cb) => {
  if (!archiveFile) {
    return cb(null, dir, archiveFile);
  }

  const match = archiveFile.match(/\.(zip|tar\.gz)$/i);
  if (!match) {
    const err = new Error(`Archive filename ${archiveFile} must end with .zip or .tar.gz`);
    log.error(err.message);
    cb(err)
  }
  const isZip = 'zip' === match[1];
  const format = isZip ? 'zip' : 'tar'
  const options = isZip ? zipOpitons : tarOptions

  const t0 = Date.now();
  log.info(`Creating archive ${archiveFile}`);

  const output = fs.createWriteStream(archiveFile);
  const archive = archiver(format, options);

  output.on('close', () => {
    log.info(t0, `Created archive ${archiveFile} with ${toHuman(archive.pointer())}`);
    return cb(null, dir, archiveFile);
  });

  archive.on('error', (err) => {
    log.error(`Failed to create archive ${archiveFile}: ${err}`)
    cb(err);
  });

  archive.pipe(output);

  archive.directory(`${dir}/`, false);

  archive.finalize();
}
