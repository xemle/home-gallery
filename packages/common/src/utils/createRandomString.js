
const NUMBERS = '0123456789'
const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER_CHARS = 'abcdefghaijklmopqrstuvwxyz'

export const ALL_PRINTABLE = new Array(256).fill(0).map((_, i) => String.fromCharCode(i)).filter(c => c.match(/[ -~]/)).join('')
export const SPECIAL_PRINTABLE = ALL_PRINTABLE.replaceAll(/[0-9A-Za-z]/g, '')
export const DEFAULT_PRINTABLE = NUMBERS + UPPER_CHARS + LOWER_CHARS

export const createRandomString = (len = 7, chars = DEFAULT_PRINTABLE) => {
  let result = ''
  while (result.length < len) {
    const rnd = Math.floor(Math.random() * chars.length)
    result += chars[rnd]
  }
  return result
}