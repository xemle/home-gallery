const createStream = (filename, cb) => {
  const fs = require('fs')
  const path = require('path')

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

module.exports = createStream