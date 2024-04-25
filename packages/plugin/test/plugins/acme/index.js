async function initialize() {
  return {
    getExtractors() {
      return []
    },
  }
}

const plugin = {
  name: 'acme',
  version: '1.0',
  initialize
}

export default plugin