const plugin = {
  name: 'ESM Plugin',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'esmQuery',
      textFn: () => ''
    })
  }
}

export default plugin
