export class NewExternalSidecarError extends Error {
  constructor(message) {
    super(message)
    this.code = 'ENEWXMP'
  }
}

export class ExternalSidecarChangeError extends Error {
  constructor(message) {
    super(message)
    this.code = 'EXMPCHG'
  }
}
