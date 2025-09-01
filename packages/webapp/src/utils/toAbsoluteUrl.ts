const baseURI = document?.baseURI || (location ? `${location.protocol}//${location.host}` : 'http://localhost:3000')

export const toAbsoluteUrl = (url: string = '') : string => (new URL(url, baseURI)).href