const plugin = {
  name: 'other',
  version: '1.0',
  requires: ['vanilla', 'acme'],
  async initialize(manager) {
    manager.register('query', {
      name: 'otherQuery',
      textFn: () => ''
    })
  }
}

export default plugin
