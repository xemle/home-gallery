const plugin = {
  name: 'foo browser',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'fooQuery',
      textFn: () => 'browser'
    })
  }
}

export default plugin