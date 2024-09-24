const plugin = {
  name: 'foo server',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'fooQuery',
      textFn: () => 'server'
    })
  }
}

export default plugin