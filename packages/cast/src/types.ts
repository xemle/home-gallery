export type TDatabaseEntry = {
  id: string
  type: string
  date: string,
  files: {
    id: string,
    index: number,
    filename: string,
  }[],
  previews: string[],
}

export type TCastEntry = {
  type: string
  title: string
  image: string
  video?: string
  toString(): string
}

export type TCastOptions = {
  serverUrl: string,
  query?: string,
  useProxy?: boolean,
  proxyIp?: string,
  port?: number,
  insecure?: boolean,
  random?: boolean,
  reverse?: boolean,
  delay?: number,
  maxPreviewSize?: number,  
}

export type TCastDevice = {
  id: string
  host: string
  host4: string
  host6: string
  name: string
}

export type TCastPlayer = {
  on: (event: string, cb: (data: any) => void) => void,
  load: (media: any, options: { autoplay?: boolean, repeat?: boolean }, cb: (err, status) => void) => void,
  stop: (cb: (err, status) => void) => void,
  pause: (cb: (err, status) => void) => void,
  play: (cb: (err, status) => void) => void,
  getStatus: (cb: (err, status) => void) => void,
}