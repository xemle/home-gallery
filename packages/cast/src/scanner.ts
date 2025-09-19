
import mdns from 'multicast-dns'

import Logger from '@home-gallery/logger'
import { TCastDevice } from './types.js'

const log = Logger('cast.dns')

const isTxt = (type, data) => type == 'TXT' && Array.isArray(data)

const convertTxt = data => {
  return data.map(buf => buf.toString()).reduce((result, line) => {
    const [key, value] = line.split('=')
    result[key] = value
    return result
  }, {})
}

const txtToString = ({type, data}) => {
  return {
    type,
    data: isTxt(type, data) ? convertTxt(data) : data
  }
}

const isChromecast = additionals => {
  const txt = additionals.find(additional => additional.type == 'TXT')
  const a = additionals.find(additional => additional.type == 'A')
  const aaaa = additionals.find(additional => additional.type == 'AAAA')
  return (a || aaaa) && txt && txt.data.md == 'Chromecast'
}

const toCastDevice = additionals => {
  const txt = additionals.find(additional => additional.type == 'TXT')
  const a = additionals.find(additional => additional.type == 'A')
  const aaaa = additionals.find(additional => additional.type == 'AAAA')

  return {
    id: txt.data.id,
    host: a && a.data || aaaa && aaaa.data || false,
    host4: a && a.data || false,
    host6: aaaa && aaaa.data || false,
    name: txt.data.fn
  }
}

export const scan = onDevice => {
  const browser = mdns()

  const devices: TCastDevice[] = []

  const handleDevice = (device: TCastDevice) => {
    const isKnown = devices.find(knownDevice => knownDevice.id == device.id)
    if (isKnown) {
      log.trace(`Found known device ${device.name} at ${device.host}`)
      return
    }
    log.debug(`Found new device ${device.name} at ${device.host}`)
    devices.push(device)

    onDevice && onDevice(device)
  }

  browser.on('response', response => {
    const additionals = response.additionals.map(txtToString)

    if (isChromecast(additionals)) {
      handleDevice(toCastDevice(additionals))
    }
  })

  browser.query({
    questions:[{
      name: '_googlecast._tcp.local',
      type: 'PTR'
    }]
  })
}

export const scanFirst = async (timeout): Promise<TCastDevice> => {
  let found = false
  return new Promise((resolve, reject) => {
    let timer
    if (timeout > 0) {
      timer = setTimeout(() => {
        found = true
        reject(new Error(`DNS scanner timeout. No Chromecast device found`))
      }, timeout)
    }

    scan(device => {
      if (found) {
        return
      }
      found = true
      clearTimeout(timer)
      resolve(device as TCastDevice)
    })
  })
}
