export class SemVer {

  major: number
  minor: number
  patch: number
  versionDepth: number

  constructor(version: string) {
    const versions = version.split('.').map(v => +v)
    this.versionDepth = versions.length || 1
    this.major = typeof versions[0] == 'number' ? versions[0] : 1
    this.minor = versions[1] || 0
    this.patch = versions[2] || 0
  }

  hasMinor() {
    return this.versionDepth > 1
  }

  hasPatch() {
    return this.versionDepth > 2
  }

  gt(other: SemVer) {
    return this.major > other.major
      || (this.major == other.major && ((!this.hasMinor() && other.hasMinor()) || (this.hasMinor() && other.hasMinor() && this.minor > other.minor)))
      || (this.major == other.major && this.minor == other.minor && ((!this.hasPatch() && other.hasPatch()) || (this.hasPatch() && other.hasPatch() && this.patch > other.patch)))
  }

  ge(other: SemVer) {
    return this.major > other.major
      || (this.major == other.major && (!this.hasMinor() || !other.hasMinor() || this.minor > other.minor))
      || (this.major == other.major && this.minor == other.minor && (!this.hasPatch() || !other.hasPatch() || this.patch >= other.patch))
  }

  isCompatible(other: SemVer) {
    return this.major == other.major && (!this.hasMinor() || !other.hasMinor() || this.minor >= other.minor)
  }

  toString() {
    if (this.versionDepth == 1) {
      return `${this.major}`
    } else if (this.versionDepth == 2) {
      return `${this.major}.${this.minor}`
    } else {
      return `${this.major}.${this.minor}.${this.patch}`
    }
  }
}