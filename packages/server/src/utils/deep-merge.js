/**
 * Merge two values deeply, with the following rules:
 *
 * - undefined loses over everything
 * - arrays are merged by concatenation and deduplication, and win over objects and scalars
 * - objects are merged by deep merging their keys, and win over scalars
 * - scalar values are overridden by the other value
 *
 * @param {any} one
 * @param {any} other
 * @param {...any} more
 * @returns {any}
 */
export function deepMerge(one, other, ...more) {
  if (more.length) {
    const merged = deepMerge(one, other)
    const next = more.shift()
    return deepMerge(merged, next, ...more)
  }
  
  // some is undefined. Undefined loose over everything
  if (typeof other == 'undefined') {
    return one
  }
  if (typeof one == 'undefined') {
    return other
  }

  // some is array. Array wins over Object or scalar
  if (Array.isArray(one) && !Array.isArray(other)) {
    return one
  }
  if (!Array.isArray(one) && Array.isArray(other)) {
    return other
  }
  if (Array.isArray(one) && Array.isArray(other)) {
    return [...new Set([
      ...one,
      ...other
    ])]
  }

  // some is object. Object wins over scalar
  if (typeof one == 'object' && typeof other != 'object') {
    return one
  }
  if (typeof one !== 'object' && typeof other == 'object') {
    return other
  }
  if (typeof one == 'object' && typeof other == 'object') {
    const keys = new Set([...Object.keys(one), ...Object.keys(other)])
    return Object.fromEntries(
      [...keys].map(key => [key, deepMerge(one[key], other[key])])
    )
  }

  // scalar values, other wins
  return other
}