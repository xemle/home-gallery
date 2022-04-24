export const isSupported = () => {
  const hasWorker = typeof Worker != undefined
  const hasBlob = typeof Blob != undefined
  const hasCreateObjectURL = typeof URL != undefined && typeof URL.createObjectURL == 'function'

  return hasWorker && hasBlob && hasCreateObjectURL 
}

const createWorker = fn => {
  const script = `"use strict";
    //debugger;

    const fn = ${fn.toString()}

    self.onmessage = event => {
      const { id, args } = event.data
      fn(...args)
        .then(data => self.postMessage({ id, data }))
        .catch(err => self.postMessage({ id, err: err.toString() }))
    }
  `
  const blob = new Blob([script], {type: 'text/javascript'})

  return new Worker(URL.createObjectURL(blob))  
}

export const toWorker = fn => {
  if (!isSupported()) {
    return fn
  }

  let nextId = 0
  const promises = {}

  const worker = createWorker(fn)

  worker.addEventListener('message', event => {
    const { id, err, data } = event.data
    if (!promises[id]) {
      return
    }
    const { resolve, reject } = promises[id]
    promises[id] = null
    err ? reject(err) : resolve(data)
  })

  return (...args) => {
    return new Promise((resolve, reject) => {
      const id = nextId++
      promises[id] = { resolve, reject }

      worker.postMessage({id, args})
    })
  }
}
