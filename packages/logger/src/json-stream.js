const createJsonStream = (rootLogger, level) => {
  rootLogger.add({level, stream: process.stdout})
}

module.exports = createJsonStream