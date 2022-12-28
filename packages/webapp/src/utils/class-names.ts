/**
 * Create a css class list from strings, arrays and objects.
 * Object keys are added if their value is truthy or a value function returns truthy
 *
 * @example
 * classNames('foo', ['bar'], {baz: true, zoo: () => true, zor: false})
 * // returns 'foo bar baz zoo'
 * @param args List of values, arrays or objects
 * @returns {string} List of class names
 */
export const classNames = (...args) => {
  return args.reduce((names, arg) => {
    if (typeof arg == 'string') {
      names.push(arg)
    } else if (Array.isArray(arg)) {
      names.push(...arg)
    } else if (typeof arg == 'object') {
      Object.entries(arg)
        .filter(([_, value]) => {
          if (typeof value == 'function') {
            return value()
          } else {
            return !!value
          }
        })
        .forEach(([name]) => names.push(name))
    }
    return names
  }, []).join(' ')
}