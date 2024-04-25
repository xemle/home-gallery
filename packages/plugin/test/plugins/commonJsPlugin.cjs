async function initialize() {
  return {
    getExtractors() {
      return []
    },
  }
}

const plugin = {
  name: 'CommonJS Plugin',
  version: '1.0',
  initialize
}

module.exports = plugin
