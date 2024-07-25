import Logger from '@home-gallery/logger';
import { through } from "@home-gallery/stream"

const log = Logger('database.slimEntry')

export const slimEntries = () => {
  return through((entry, enc, cb) => {
    const {id, date, updated, groups } = entry
    const { index, filename } = entry.files[0]
    const files = entry.files.map(({index, filename, size}) => ({index, filename, size}))

    const toStringId = `${id.substring(0, 7)}:${index}:${filename}`

    const slimEntry = {
      id,
      date,
      updated,
      files,
      groups: groups || [],
      toString() {
        return toStringId
      }
    }

    cb(null, slimEntry)
  })
}

export const fattenEntries = (storage) => {
  return through((slimEntry, enc, cb) => {
    storage.readMediaCache(slimEntry, (err, entry) => {
      if (err) {
        log.warn(err, `Failed to read media cache for slim entry ${slimEntry}. Skip it`)
        return cb()
      }
      cb(null, entry)
    })
  })
}
