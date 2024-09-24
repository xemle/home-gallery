import fs from 'fs';
import zlib from 'zlib';
import { pipeline } from 'stream'

import { parseJson, write } from '@home-gallery/stream';

export const readJsonGzip = (filename, cb) => {
  let result
  pipeline(
    fs.createReadStream(filename),
    zlib.createGunzip(),
    parseJson(),
    write(data => result = data),
    err => cb(err, result)
  )
}
