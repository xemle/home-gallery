const EventEmitter = require('events')
const http = require('http')
const https = require('https')

const log = require('@home-gallery/logger')('fetch.eventstream')

const parseEvent = data => {
  const lines = data.toString().split('\n').filter(line => !!line)
  let event = Object.fromEntries(lines.map(line => line.split(/:\s+/)))
  if (event.data?.match(/^\{.*\}$/)) {
    try {
      event.data = JSON.parse(event.data)
    } catch (e) {
      log.warn(`Could not parse event data as json: ${event.data}`)
    }
  }
  return event
}

class EventSource extends EventEmitter {
  connected = false

  constructor (url, options = {}) {
    super()
    this.url = url
    this.options = options
  }

  connect() {
    if (this.connected) {
      return
    }

    const onResponse = res => {
      if (res.statusCode != 200) {
        res.resume()
        res.destroy(new Error(`Unexpected status code ${res.statusCode}`))
        return
      }

      res.setEncoding('utf8')
      this.connected = true
      this.emit('connected')

      res.on('data', data => {
        this.emit('event', parseEvent(data))
      })
      res.on('end', () => {
        this.emit('disconnected')
        this.connected = false
      })
      res.on('error', err => {
        this.emit('error', err)
        this.emit('disconnected')
        this.connected = false
      })
      this.on('destroy', () => res.destroy())
    }

    const h = this.url.startsWith('https') ? https : http
    h.get(`${this.url}`, this.options, onResponse)
      .on('error', err => this.emit('error', err))
  }

  disconnect() {
    this.emit('destroy')
  }
}

module.exports = {
  EventSource
}