import fs from 'fs'
import path from 'path'

const createStream = (filename, cb) => {
  const createWriteStream = () => cb(null, fs.createWriteStream(filename, {flags: 'a'}))

  const dir = path.dirname(filename)
  fs.stat(dir, (err, stat) => {
    if (err && err.code == 'ENOENT') {
      fs.mkdir(dir, {recursive: true}, err => {
        if (err) {
          cb(err)
        } else {
          createWriteStream()
        }
      })
    } else if (err) {
      cb(err)
    } else if (!stat.isDirectory()) {
      cb(new Error(`Log directory ${dir} is not a directory`))
    } else {
      createWriteStream()
    }
  })
}

export const createFileStream = (rootLogger, filename, level, cb) => {
  createStream(filename, (err, stream) => {
    if (err && cb) {
      cb(err)
    } else if (err) {
      rootLogger.error(err, `Could not create file logger for ${filename}: ${err}`)
    } else {
      rootLogger.add({ level: level || 'info', stream: stream })
      cb && cb()
    }
  })
}
