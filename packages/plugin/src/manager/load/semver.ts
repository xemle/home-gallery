export class SemVer {
  major = 1
  minor = 0
  patch = 0
  hasMinor = false
  hasPatch = false

  constructor(version: string) {
    const match = version.match(/^(\d+(\.\d+(\.\d+)?)?)/)
    if (!match) {
      return
    }
    const n = match[1].split('.').map(v => +v)
    this.major = n[0]
    if (n.length > 1) {
      this.hasMinor = true
      this.minor = n[1]
    }
    if (n.length > 2) {
      this.hasPatch = true
      this.patch = n[2]
    }
  }

  matches(other: SemVer) {
    if (this.major != other.major) {
      return false
    }
    
    if (!this.hasMinor || !other.hasMinor || this.minor > other.minor) {
      return true
    } else if (this.minor < other.minor) {
      return false
    }

    return !this.hasPatch || !other.hasPatch || this.patch >= other.patch
  }
}