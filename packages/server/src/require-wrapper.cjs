module.exports = {
  startServer(options, cb) {
    import('./index.js')
      .then(({startServer}) => startServer(options, cb), cb)
  }
}