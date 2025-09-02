import { SemVer } from './SemVer.js'

/**
 * @property {string} type
 * @property {string} [minVersion]
 */
export class GalleryFileType {
  constructor(type, minVersion) {
    const [name, version] = type.split('@')
    this.name = name
    /**
     * @type {import('./SemVer.js').SemVer}
     */
    this.semVer = new SemVer(version || '1.0')
    /**
     * @type {import('./SemVer.js').SemVer}
     */
    this.minSemVer = minVersion ? new SemVer(minVersion) : new SemVer(`${this.semVer.major}.0.0`)
  }

  static isFileType(type) {
    return !!type?.match(/^[-\w/]+(@\d+(\.\d+(\.\d+)?)?)?$/)
  }

  /**
   * @param {GalleryFileType} other
   */
  isCompatible(other) {
    return this.name == other.name && (this.semVer.ge(other.semVer) && other.semVer.ge(this.minSemVer))
  }

  /**
   * @param {string} type
   */
  isCompatibleType(type) {
    return GalleryFileType.isFileType(type) && this.isCompatible(new GalleryFileType(type))
  }

  toString() {
    return `${this.name}@${this.semVer}`
  }
}