async function initialize() {
  return {
    getExtractors() {
      return []
    },
  }
}

const plugin = {
  name: 'vanilla',
  version: '1.0',
  initialize
}

export default plugin