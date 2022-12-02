const { getMetaEntries } = require('./utils')

const log = require('@home-gallery/logger')('database.media.date')

// '0000:00:00 00:00:00' => false
// {tzoffsetMinutes: 120, rawValue: '2004:10:19 10:34:17'} => '2004-10-19T10:34:17+02:00'
function parseExiftoolDate(entry, date) {
  let value = date?.rawValue ? date.rawValue : date
  if (typeof value !== 'string' || value.length < 10 || value.startsWith('0000')) {
    return false
  }

  const match = value.match(/(\d{4}).(\d{2}).(\d{2}).(\d{2}).(\d{2}).(\d{2})(\.\d+)?(([-+](\d{2}:\d{2}|\d{4}))|Z)?\s*$/)
  if (!match) {
    log.warn(`Unknown time format ${value} of ${JSON.stringify(date)} of entry ${entry}`)
    return false
  }

  let iso8601 = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${match[7] ? match[7] : ''}`
  if (date.tzoffsetMinutes && !match[8]) {
    const offset = Math.abs(date.tzoffsetMinutes)
    const negative = date.tzoffsetMinutes < 0
    const hour = '' + (offset / 60).toFixed()
    const minute = '' + (offset % 60)
    const offsetText = (negative ? '-' : '+') + hour.padStart(2, '0') + ':' + minute.padStart(2, '0')
    iso8601 += offsetText
  } else if (match[8]) {
    iso8601 += match[8]
  }

  try {
    return new Date(iso8601).toISOString()
  } catch(e) {
    log.error(`Could not create valid ISO8601 date '${iso8601}' from '${JSON.stringify(date)}' of entry ${entry}: ${e}`)
    return false
  }
}

function getExifDate(entry) {
  const exif = entry.meta?.exif
  if (!exif) {
    return false
  }
  const dateKeys = ['GPSDateTime', 'SubSecDateTimeOriginal', 'DateTimeOriginal', 'CreateDate']
  return dateKeys.reduce((date, key) => date || parseExiftoolDate(entry, exif[key]), false)
}

function getEntryDate(entry) {
  const metaEntries = getMetaEntries(entry)
  const metaDate = metaEntries.reduce((date, entry) => date || getExifDate(entry), false)
  if (metaDate) {
    return metaDate
  }

  const allEntries = [entry, ...(entry.sidecars || [])]
  return allEntries.reduce((date, entry) => date || getExifDate(entry), false)
}

module.exports = {
  getEntryDate
}