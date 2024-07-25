import { pipeline } from 'stream/promises';

import Logger from '@home-gallery/logger'
import { getIndexName, getJournalFilename, readJournal } from '@home-gallery/index';
import { promisify } from '@home-gallery/common';
import { filter, each, through } from '@home-gallery/stream';

import { createOrEmptyReadableStream } from '../database/read-database-stream.js';
import { createWriteStream } from '../database/write-database-stream.js';

const log = Logger('database.mergeJournal');

const readJournalAsync = promisify(readJournal)

export const mergeFromJournal = async (indexFilenames, journal, databaseFilename, slimEntries, storage) => {
  const journals = await readJournals(indexFilenames, journal)

  if (hasAnyChanges(slimEntries, journals)) {
    const err = new Error(`Journals contain no changes`)
    err.code = 'ENOCHANGE'
    throw err
  }

  const readable = await createOrEmptyReadableStream(databaseFilename)
  const removeStream = await createRemoveStream(journals)
  const insertStream = await createInsertStream(slimEntries, storage)
  const writeStream = await createWriteStream(databaseFilename)

  let prevCount = 0
  let totalCount = 0
  const t0 = Date.now()
  await pipeline(
    readable,
    each(() => prevCount++),
    removeStream.stream,
    insertStream,
    each(() => totalCount++),
    writeStream,
  )

  log.info(t0, `Merged ${slimEntries.length} new and ${removeStream.count()} removed entries from journals to ${totalCount} entries (${diffCount(totalCount, prevCount)})`)
  return totalCount
}

/**
 * @typedef JournalData
 * @property {object[]} adds
 * @property {object[]} changes
 * @property {object[]} removes
 */
/**
 * @typedef IndexJournal
 * @property {string} index
 * @property {JournalData} data
 */

/**
 * @param {string[]} indexFilenames
 * @param {string} journal
 * @returns {IndexJournal[]}
 */
const readJournals = async (indexFilenames, journal) => {
  let i = 0;
  const result = [];

  for (const indexFilename of indexFilenames) {
    const index = getIndexName(indexFilename)
    const journalFilename = getJournalFilename(indexFilename, journal)
    await readJournalAsync(indexFilename, journal)
      .then(journalData => {
        log.info(`Read file index journal ${journalFilename}`)
        result.push({index, data: journalData.data})
      })
      .catch(err => {
        log.debug(err, `Failed to read index journal ${journalFilename}. Skip it`)
      })
  }

  return result
}

/**
 * @param {IndexJournal[]} journals
 * @returns {object.<string, object.<string, boolean>}
 */
const getJournalFiles = (journals) => {
  const journalFileMap = journals.reduce((map, journal) => {
    map[journal.index] = {}
    return map
  }, {})

  const addFilesToMap = (index, files) => {
    files.forEach(file => journalFileMap[index][file.filename] = true)
  }

  for (const journal of journals) {
    const { index, data } = journal
    const { adds, changes, removes } = data

    addFilesToMap(index, adds)
    addFilesToMap(index, changes)
    addFilesToMap(index, removes)
  }

  return journalFileMap
}

/**
 * @param {object[]} slimMedia
 * @param {IndexJournal[]} journals
 */
const hasAnyChanges = (slimMedia, journals) => {
  const journalsWithRemoves = journals.filter(journal => journal.data.removes.length)
  return !slimMedia.length && !journalsWithRemoves.length
}

const diffCount = (count, prevCount) => {
  const diff = count - prevCount
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff}`
}

/**
 * @typedef RemoveStreamResult
 * @property {import('stream').Transform} stream
 * @property {function} count
 */
/**
 * @param {IndexJournal[]} journals
 * @returns {RemoveStreamResult}
 */
const createRemoveStream = async (journals) => {
  const journalIndices = journals.map(journal => journal.index)
  const journalFileMap = getJournalFiles(journals)

  let removeCount = 0
  const stream = filter(media => {
    const { files } = media
    const index = files[0].index
    if (!journalIndices.includes(index)) {
      return true
    }

    const hasAnyJournalFile = files.find(file => {
      return journalFileMap[index][file.filename]
    })

    if (!hasAnyJournalFile) {
      return true
    }
    removeCount++
    return false
  })

  return {
    stream,
    count() {
      return removeCount
    }
  }
}

/**
 * @param {object} slimEntries
 * @param {import('../storage.js').Storage} storage
 * @returns
 */
const createInsertStream = async (slimEntries, storage) => {
  let insertIndex = 0

  const insertMedia = (ctx, date, cb) => {
    const next = () => {
      if (insertIndex >= slimEntries.length || slimEntries[insertIndex].date < date) {
        return cb()
      }

      const slimEntry = slimEntries[insertIndex++]
      storage.readMediaCache(slimEntry, (err, entry) => {
        if (err) {
          log.warn(err, `Failed to read media cache for slim entry ${slimEntry}. Skip it`)
          return next()
        }
        ctx.push(entry)
        next()
      })
    }

    next()
  }

  return through(function(media, enc, cb) {
    if (insertIndex >= slimEntries.length) {
      // all files have been inserted already
      return cb(null, media)
    }

    // insert entries until media date
    insertMedia(this, media.date, () => {
      cb(null, media)
    })
  }, function(cb) {
    // insert remaining entries
    insertMedia(this, '0000-00-00', () => {
      storage.clearCache()
      cb()
    })
  })
}
