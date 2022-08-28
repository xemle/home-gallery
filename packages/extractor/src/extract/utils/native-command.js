const isWindows = () => process.platform.match(/win32/i)

const getNativeCommand = command => `${command}${isWindows() ? '.exe' : ''}`

module.exports = {
  isWindows,
  getNativeCommand
}