export const createJsonStream = (rootLogger, level) => {
  const stream = process.stdout
  rootLogger.add({level, stream})
  stream.on('error', err => {
    // ignore. This error can happen on process termination
  })
}
