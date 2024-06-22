import fs from 'fs';
import path from 'path';

export function readStorageFile(storageDir, entryFile, cb) {
  fs.readFile(path.join(storageDir, entryFile), cb);
}
