import fs from 'fs';

export const rewriteFile = (file, rewriteFn, cb) => {
  fs.readFile(file, {encoding: 'utf8'}, (err, data) => {
    if (err) {
      const e = new Error(`Could not read ${file} for rewrite: ${err}`)
      e.cause = err;
      return cb(e)
    }

    fs.writeFile(file, rewriteFn(data), {encoding: 'utf8'}, (err) => {
      if (err) {
        const e = new Error(`Could not write ${file} for rewrite: ${e}`)
        e.cause = err;
        return cb(e)
      }
      cb();
    })
  })
}
