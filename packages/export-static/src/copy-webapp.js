import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

import Logger from '@home-gallery/logger'

const log = Logger('export.copy.webapp');
import { forEach } from '@home-gallery/common';

import { copyFile } from './copy-file.js';

export const copyWebapp = (database, dir, basePath, cb) => {
  const t0 = Date.now();
  const srcDir = path.resolve(__dirname, 'public');
  const dstDir = path.join(dir, basePath)
  glob('**/*', {
    cwd: srcDir,
    dot: true
  }).then(files => {
    forEach(files, (filename, cb) => copyFile(filename, srcDir, dstDir, cb), (err) => {
      if (err) {
        log.error(err, `Could not copy webapp sources to ${dstDir}: ${err}`)
        return cb(err);
      }
      log.info(t0, `Copied ${files.length} webapp sources to ${dstDir}`);
      cb(null, database, dir, basePath);
    })
  })
  .catch(err => {
    log.error(err, `Could not collect webapp sources of ${srcDir}: ${err}`);
    return cb(err);
  })
}
