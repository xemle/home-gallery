class NewExternalSidecarError extends Error {
  constructor(message) {
    super(message)
    this.code = 'ENEWXMP'
  }
}

class ExternalSidecarChangeError extends Error {
  constructor(message) {
    super(message)
    this.code = 'EXMPCHG'
  }
}

module.exports = {
  NewExternalSidecarError,
  ExternalSidecarChangeError
}