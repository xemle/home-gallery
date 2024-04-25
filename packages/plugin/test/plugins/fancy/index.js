async function initialize() {
  return {
    getExtractors() {
      return []
    },
  }
}

const plugin = {
  name: 'fancy',
  version: '1.0',
  initialize
}

module.exports = plugin