export type TStorage = {
  /**
   * Evaluates if the entry has given storage file
   *
   * @param {TStorageEntry} entry
   * @param {string} suffix Dashed cased storage file suffix. Eg. `geo-data.json.gz`
   */
  hasFile(entry: TStorageEntry, suffix: string): boolean
  /**
   * Reads a file from the storage
   *
   * @param {TStorageEntry} entry
   * @param {string} suffix Dashed cased storage file suffix. Eg. `geo-data.json.gz`
   * @returns {Promise<Buffer | any>} If the suffix ends on `.json` or `.json.gz` the data is automatically decompressed, deserialized
   */
  readFile(entry: TStorageEntry, suffix: string): Promise<Buffer | any>
  /**
   * Write a extracted data to the storage.
   *
   * If the suffix ends on `.json` or `.json.gz` the data is automatically serialized and compressed.
   * The storage file is added to the entry `.files` array and the json data is added to the `.meta` object
   *
   * @param {TStorageEntry} entry Entry of data
   * @param {string} suffix Dashed cased storage file suffix. Eg `exif.json`, `geo-data.json.gz` or `preview-image-480.png`
   * @param {Buffer | string | any} data Data to write
   */
  writeFile(entry: TStorageEntry, suffix: string, data: Buffer | string | any): Promise<void>
  /**
   * Copy a local file to the storage
   *
   * @param {TStorageEntry} entry
   * @param {string} suffix Dashed cased suffix. Eg. `geo-data.json.gz`
   * @param {string} file Local file path, readable from current working directory
   */
  copyFile(entry: TStorageEntry, suffix: string, file: any): Promise<void>
  /**
   * Creates a symbolic link from a local file
   *
   * @param {TStorageEntry} entry
   * @param {string} suffix Dashed cased suffix. Eg. `geo-data.json.gz`
   * @param {string} file Local file path, readable from current working directory
   */
  symlink(entry: TStorageEntry, suffix: string, file: string): Promise<any>
  /**
   * Removes a file from the storage directory
   *
   * @param {TStorageEntry} entry
   * @param {string} suffix Dashed cased suffix. Eg. `geo-data.json.gz`
   */
  removeFile(entry: TStorageEntry, suffix: string): Promise<any>
  /**
   * Creates a local file handle new or existing storage files.
   *
   * The file handle should be committed or released after usage
   *
   * @param {TStorageEntry} entry
   * @param {string} suffix Dashed cased suffix. Eg. `geo-data.json.gz`
   */
  createLocalFile(entry: TStorageEntry, suffix: string): Promise<TLocalStorageFile>
  /**
   * Create local directory to create files
   *
   * These files can be added to the storage later
   */
  createLocalDir(): Promise<TLocalStorageDir>
}

export type TStorageEntry = {
  indexName: string
  /**
   * Relative filename from the file index root
   */
  filename: string
  /**
   * File size in bytes
   */
  size: number
  /**
   * Modified date of the file in ISO
   */
  date: string
  /**
   * Type of the file like image, rawImage, video, ...
   */
  type: string
  /**
   * SHA1 sum of the file
   */
  sha1sum: string
  /**
   * Meta data. Key is the suffix without `.json` or `.json.gz` extension in camelCase. E.g. if suffix is `geo-data.json.gz` the is key is `geoData`
   */
  meta: {
    [key: string]: any
  }
  /**
   * List of storage files including meta files
   */
  files: string[]
  /**
   * Grouped sidecar files sharing the same base filename. E.g. files `IMG_1234.jpg`, `IMG_1234.jpg.xmp`, , `IMG_1234.json` share the same base filename `IMG_1234`.
   */
  sidecars: TStorageEntry[]
}

/**
 * Local storage file which can be committed or rejected to the storage
 */
export type TLocalStorageFile = {
  file: string,
  /**
   * Copies the file to the storage and removes the local file
   */
  commit: () => Promise<void>,
  /**
   * Removes the local file
   */
  release: () => Promise<void>
}

export type TLocalStorageDir = {
  dir: string
  /**
   * Removes the local directory
   */
  release: () => Promise<void>
}