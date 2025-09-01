((window, document) => {
  const queryParams = new URLSearchParams((document?.location?.search || '?').substring(1))
  const debugToken = queryParams.get('debugToken')
  const debugSession = queryParams.get('debugSession') || 'default'

  if (!debugToken) {
    return
  }

  const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const consoleOrig = window.console

  const clientId = uuid()
  const logMethods = ['debug', 'log', 'info', 'warn', 'error']

  const send = (method, ...args) => {
    const url = new URL('api/debug/console', document?.baseURI || 'http://localhost:3000')
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        debugToken,
        debugSession,
        date: new Date().toISOString(),
        method,
        args
      }),
    })
    .catch((error) => {
      consoleOrig.error('Error:', error);
    });
  }

  const handler = {
    get(target, prop, receiver) {
      const value = target[prop]
      if (!logMethods.includes(prop)) {
        return value
      } else if (value instanceof Function) {
        return function(...args) {
          send(prop, ...args)
          return value.apply(this === receiver ? target : this, args)
        }
      } else {
        return value
      }
    }
  }

  window.console = new Proxy(window.console, handler)
})(window, document)
