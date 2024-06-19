module.exports = {
  async fetch(remote, options) {
    return import('./index.js')
      .then(({fecth}) => fetch(remote, options))
  },
  async fetchDatabase(remote) {
    return import('./index.js')
      .then(({fetchDatabase}) => fetchDatabase(remote))
  },
  async fetchEvents(remote) {
    return import('./index.js')
      .then(({fetchEvents}) => fetchEvents(remote))
  },
  async fetchRemote(remote) {
    return import('./index.js')
      .then(({fetchRemote}) => fetchRemote(remote))
  },
}