const plugin = {
  name: 'browser query',
  version: '1.0',
  environments: ['browser'],
  async initialize(manager) {
    manager.register('query', {
      name: 'browserQuery',
      textFn: () => 'browser'
    })
  }
}

export default plugin