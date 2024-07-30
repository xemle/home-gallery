async function initialize() {
  return {
    getExtractors() {
      return []
    },
  }
}

const plugin = {
  name: 'other',
  version: '1.0',
  requires: ['vanilla', 'acme'],
  initialize
}

export default plugin
