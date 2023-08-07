const $base = Symbol("$base")

const $isProxy = Symbol("isProxy")

const createHandler = (base) => {
  const props = {}
  const deletedProps = []

  return {
    get(target, key, receiver) {
      if (key === $isProxy) {
        return true
      } else if (key === $base) {
        return base
      } else if (deletedProps.includes(key)) {
        return undefined
      } else if (Reflect.has(props, key)) {
        return Reflect.get(props, key, receiver)
      }
      const v = Reflect.get(target, key, receiver)
      if (!v || v[$isProxy] || typeof v != 'object') {
        return v
      }
      const proxy = new Proxy(v, createHandler(v))
      Reflect.set(props, key, proxy)
      return proxy
    },
    set(_, key, value) {
      const index = deletedProps.indexOf(key)
      if (index >= 0) {
        deletedProps.splice(index, 1)
      }
      return Reflect.set(props, key, value)
    },
    has(target, key) {
      return !deletedProps.includes(key) && (Reflect.has(props, key) || Reflect.has(target, key))
    },
    deleteProperty(_, key) {
      if (!deletedProps.includes(key)) {
        deletedProps.push(key)
      }
      return Reflect.deleteProperty(props, key)
    }
  }
}

const wrapCowProxy = (obj) => new Proxy(obj, createHandler(obj))

const unwrapCowProxy = (proxy) => proxy[$isProxy] ? proxy[$base] : proxy

module.exports = {
  wrapCowProxy,
  unwrapCowProxy
}