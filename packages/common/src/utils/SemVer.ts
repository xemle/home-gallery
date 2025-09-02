export class SemVer {

  /**
   * @param {string} version semantic version
   */
  constructor(version) {
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

  /**
   * @param {SemVer} other 
   */
  gt(other) {
    return this.major > other.major
      || (this.major == other.major && ((!this.hasMinor() && other.hasMinor()) || (this.hasMinor() && other.hasMinor() && this.minor > other.minor)))
      || (this.major == other.major && this.minor == other.minor && ((!this.hasPatch() && other.hasPatch()) || (this.hasPatch() && other.hasPatch() && this.patch > other.patch)))
  }

  /**
   * @param {SemVer} other 
   */
  ge(other) {
    return this.major > other.major
      || (this.major == other.major && (!this.hasMinor() || !other.hasMinor() || this.minor > other.minor))
      || (this.major == other.major && this.minor == other.minor && (!this.hasPatch() || !other.hasPatch() || this.patch >= other.patch))
}

  /**
   * @param {SemVer} other 
   */
  isCompatible(other) {
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