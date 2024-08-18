const plugin = {
  name: 'fancy',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'fancyQuery',
      textFn: () => ''
    })
  }
}

module.exports = plugin