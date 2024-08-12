const plugin = {
  name: 'acme',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'acmeQuery',
      textFn: () => ''
    })
  }
}

export default plugin