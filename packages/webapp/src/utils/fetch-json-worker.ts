import { toWorker } from './to-worker'

export const toAbsoluteUrl = (url: string) : string => (new URL(url, document?.baseURI || '/')).href

const fetchWorker = toWorker('fetch', (url, init) => {
  return fetch(url, init || {})
    .then(res => {
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Unexpected status code of ${res.status} for url ${url}`)
      }
      return res.json()
    })
  })

export const fetchJsonWorker = (url, init = {}) => fetchWorker(toAbsoluteUrl(url), init)
