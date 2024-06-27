import fs from 'fs';
import fetch from 'node-fetch';

export const downloadFile = async (url, file) => {
  await fetch(url)
    .then(res => {
      return new Promise((resolve, reject) => {
        const dst = fs.createWriteStream(file);
        dst.on('error', e => reject(e))
        dst.on('close', () => resolve(true));
        res.body.pipe(dst)
      })
    })
}
