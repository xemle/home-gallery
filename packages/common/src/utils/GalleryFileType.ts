import { SemVer } from './SemVer.js'

export class GalleryFileType {
  name: string
  semVer: SemVer
  minSemVer: SemVer

  constructor(type: string, minVersion?: string) {
    const [name, version] = type.split('@')
    this.name = name
    this.semVer = new SemVer(version || '1.0')
    this.minSemVer = minVersion ? new SemVer(minVersion) : new SemVer(`${this.semVer.major}.0.0`)
  }

  static isFileType(type: string) {
    return !!type?.match(/^[-\w/]+(@\d+(\.\d+(\.\d+)?)?)?$/)
  }

  isCompatible(other: GalleryFileType) {
    return this.name == other.name && (this.semVer.ge(other.semVer) && other.semVer.ge(this.minSemVer))
  }

  isCompatibleType(type: string) {
    return GalleryFileType.isFileType(type) && this.isCompatible(new GalleryFileType(type))
  }

  toString() {
    return `${this.name}@${this.semVer}`
  }
}