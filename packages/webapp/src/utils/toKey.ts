let counter = 0

const map = new WeakMap()

export const toKey = (value : any) => {
  if (typeof value != 'object' && typeof value != 'function') {
    return typeof value?.toString == 'function' ? value.toString() : value
  }

  let key = map.get(value)
  if (!key) {
    key = ++counter
    map.set(value, key)
  }
  return key
}