module.exports = {
  async exportMeta(options = {}) {
    return import('./index.js')
      .then(({exportMeta}) => exportMeta(options))
  }
}