const plugin = {
  name: 'vanilla',
  version: '1.0',
  async initialize(manager) {
    manager.register('query', {
      name: 'vanillaQuery',
      textFn: () => ''
    })
  }
}

export default plugin