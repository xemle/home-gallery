import chalk from 'chalk'

// credits to TJ Holowaychuk <tj@vision-media.ca> from debug package
// for color values and hash algorithm
const colors16 = [
  chalk.cyan, chalk.green, chalk.yellow, chalk.blue, chalk.red, chalk.magenta
]

const colors256 = [
  20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57,
  62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99,
  112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167,
  168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201,
  202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221
]

const moduleHash = module => {
  let hash = 0;

  for (let i = 0; i < module.length; i++) {
    hash = ((hash << 5) - hash) + module.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash)
}

const identityFn = v => v

const colorNoneFns = {
  moduleColorFn: () => identityFn,
  durationColorFn: () => '',
  trace: { levelColorFn: identityFn, msgColorFn: identityFn },
  debug: { levelColorFn: identityFn, msgColorFn: identityFn },
  info: { levelColorFn: identityFn, msgColorFn: identityFn },
  warn: { levelColorFn: identityFn, msgColorFn: identityFn },
  error: { levelColorFn: identityFn, msgColorFn: identityFn },
  fatal: { levelColorFn: identityFn, msgColorFn: identityFn },
}

const color16Fns = {
  moduleColorFn: module => colors16[moduleHash(module) % colors16.length].bold,
  durationColorFn: chalk.grey,
  trace: { levelColorFn: chalk.grey, msgColorFn: chalk.grey },
  debug: { levelColorFn: chalk.grey, msgColorFn: chalk.grey },
  info: { levelColorFn: identityFn, msgColorFn: identityFn },
  warn: { levelColorFn: chalk.yellow.bold, msgColorFn: chalk.yellow },
  error: { levelColorFn: chalk.red.bold, msgColorFn: chalk.red },
  fatal: { levelColorFn: chalk.black.bgRed.bold, msgColorFn: chalk.red }
}

const color256Fns = Object.assign({}, color16Fns, {
  moduleColorFn: module => chalk.ansi256(colors256[moduleHash(module) % colors256.length]).bold,
})

export const colorFns = chalk.level == 0 ? colorNoneFns : (chalk.level < 2 ? color16Fns : color256Fns)
