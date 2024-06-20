import path from 'path';

import Logger from '@home-gallery/logger'

const log = Logger('export.webapp.basePath');

import { rewriteFile } from './rewrite-file.js';

const trimSlashes = s => s.replace(/(^\/+|\/+$)/g, '')

export const setBasePath = (dir, basePath, cb) => {
  const trimmedBasePath = trimSlashes(basePath)
  if (!trimmedBasePath.length) {
    return cb(null, dir);
  }
  const t0 = Date.now();
  const indexFilename = path.join(dir, basePath, 'index.html')
  const base = `/${trimmedBasePath}/`
  rewriteFile(indexFilename, data => {
    return data.replace(/<base [^>]+>/, `<base href="${base}">`)
  }, (err) => {
    if (err) {
      return cb(err);
    }
    log.info(t0, `Set base path to ${base}`)
    cb(null, dir)
  });
}
