export class EventBus {
  listeners = {}

  addEventListener(type: string, callback: Function) {
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(callback)
  }

  removeEventListener(type: string, callback: Function) {
    const callbacks = this.listeners[type]
    const index = callbacks?.indexOf(callback)
    if (index >= 0) {
      this.listeners[type].splice(index, 1)
    }
  }

  dispatch(event: any) {
    const callbacks = this.listeners[event.type]
    callbacks?.forEach(callback => callback(event))
  }
}