export const isSupported = () => {
  const hasWorker = typeof Worker != undefined
  const hasBlob = typeof Blob != undefined
  const hasCreateObjectURL = typeof URL != undefined && typeof URL.createObjectURL == 'function'
  const isDisabled = window['__homeGallery']?.disabled?.includes('worker')

  return hasWorker && hasBlob && hasCreateObjectURL && !isDisabled
}

export const toWorker = (name, fn) => {
  if (!isSupported()) {
    return fn
  }

  const worker = createWorkerInstance(name, `() => ({main: ${fn.toString()}})`, [], {})

  return (...args) => worker('main', ...args)
}

export const toFactoryWorker = (name: string, factoryFn: Function, factoryArgs: any[] = [], eventHandler = {}) => {
  if (!isSupported()) {
    return toNativeFactory(name, factoryFn, factoryArgs, eventHandler)
  }

  return createWorkerInstance(name, factoryFn.toString(), factoryArgs, eventHandler)
}

function createWorkerInstance(name, factoryFn, factoryArgs: any[] = [], eventHandler = {}) {
  let nextId = 0
  const promises = {}

  const worker = createWorker(name, factoryFn, factoryArgs, Object.keys(eventHandler))

  worker.addEventListener('message', message => {
    const type = message.data.type
    switch (type) {
      case 'method': {
        const { id, err, data } = message.data
        if (!promises[id]) {
          return
        }
        const { resolve, reject } = promises[id]
        promises[id] = null
        err ? reject(err) : resolve(data)
        break
      }
      case 'event': {
        const { event, args } = message.data
        if (typeof eventHandler[event] == 'function') {
          eventHandler[event](...args)
        }
        break;
      }
      default: {
        console.log(`Unknown message type ${type}`)
      }
    }
  })

  return (method, ...args) => {
    return new Promise((resolve, reject) => {
      const id = nextId++
      promises[id] = { resolve, reject }

      worker.postMessage({type: 'method', id, method, args})
    })
  }
}

export function toNativeFactory(_: string, factoryFn: Function, factoryArgs: any[] = [], eventHandler = {}) {
  const instance = factoryFn(...factoryArgs)

  async function callMethod(method, args) {
    if (typeof instance[method] != 'function') {
      throw new Error('Unknown method ' + method)
    }
    return instance[method](...args)
  }

  function mapEvents(events) {
    for (const event of events) {
      instance[event] = eventHandler[event]
    }
  }

  mapEvents(Object.keys(eventHandler))

  return (method, ...args) => callMethod(method, args)
}

function createWorker(name, factoryFn, factoryArgs: any[] = [], events: string[] = []) {
  const script = `"use strict";
    //debugger;

    const factory = ${factoryFn}
    const instance = factory(${stringifyArgs(factoryArgs)})

    self.onmessage = onMessage
    mapEvents(${JSON.stringify(events)})

    function onMessage(message) {
      const type = message.data?.type
      switch (type) {
        case 'method': {
          const { type, id, method, args } = message.data
          callMethod(method, args)
            .then(data => self.postMessage({ type, method, id, data }))
            .catch(err => self.postMessage({ type, method, id, err: err.toString() }))
          break
        }
        default: {
          console.log('Unknown message type ' + type)
        }
      }
    }

    async function callMethod(method, args) {
      if (typeof instance[method] != 'function') {
        throw new Error('Unknown method ' + method)
      }
      return instance[method](...args)
    }

    function mapEvents(events) {
      for (const event of events) {
        instance[event] = (...args) => {
          self.postMessage({type: 'event', event, args})
        }
      }
    }
  `
  const blob = new Blob([script], {type: 'text/javascript'})

  return new Worker(URL.createObjectURL(blob), {name})
}

function stringifyArgs(args) {
  if (args.length == 0) {
    return ''
  }
  const json = JSON.stringify(args)
  return json.substring(1, json.length - 1)
}