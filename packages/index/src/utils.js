const path = require('path')

const getIndexName = filename => path.basename(filename).replace(/\.[^.]+$/, '')

module.exports = {
  getIndexName
}