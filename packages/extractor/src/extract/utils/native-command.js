export const isWindows = () => process.platform.match(/win32/i)

export const getNativeCommand = command => `${command}${isWindows() ? '.exe' : ''}`
