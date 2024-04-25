async function initialize() {
  return {
    getExtractors() {
      return []
    },
  }
}

const plugin = {
  name: 'ESM Plugin',
  version: '1.0',
  initialize
}

export default plugin
