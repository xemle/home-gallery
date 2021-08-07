import { Event } from './models'

const name = 'home-gallery/events'
const major = 1
const minor = 0

export const HeaderType = `${name}@${major}.${minor}`

export const isEventTypeCompatible = (type: string) => type?.startsWith(`${name}@${major}.`)

export interface EventDatabase {
  type: string,
  created: string,
  data: Event[]
}

export const createHeader = () => {
  return {
    type: HeaderType,
    created: new Date().toISOString()
  }
}