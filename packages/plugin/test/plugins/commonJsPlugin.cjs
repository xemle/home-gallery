const plugin = {
  name: 'CommonJS Plugin',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'commonJsQuery',
      textFn: () => ''
    })
  }
}

module.exports = plugin
