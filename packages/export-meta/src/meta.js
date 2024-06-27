import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import assert from 'assert'
import crypto from 'crypto'
import { ExifTool } from 'exiftool-vendored';

import Logger from '@home-gallery/logger'

const log = Logger('export.meta.writer')

import { through } from '@home-gallery/stream'

import { findSidecar } from './sidecar.js'

import { NewExternalSidecarError, ExternalSidecarChangeError } from './errors.js'

const createSha1 = async file => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1')
    createReadStream(file)
      .on('data', data => hash.update(data))
      .on('error', err => reject(err))
      .on('close', () => resolve(hash.digest('hex')))
  })
}

const validateSidecar = async (entry, baseDir, sidecar) => {
  const hasFile = await exists(sidecar)
  if (!hasFile) {
    return
  }

  const entrySidecar = entry.files.find(file => path.join(baseDir, file.filename) == sidecar)
  if (!entrySidecar) {
    throw new NewExternalSidecarError(`Sidecar ${sidecar} is unknown`)
  }
  const checksum = await createSha1(path.join(baseDir, entrySidecar.filename))
  if (checksum != entrySidecar.id) {
    throw new ExternalSidecarChangeError(`Sidecar ${sidecar} was changed. Expected checksum ${entrySidecar.id} but was ${checksum}`)
  }
}

const findEntrySidecar = async (entry, rootMap) => {
  const primaryFile = entry.files[0]
  const baseDir = rootMap[primaryFile.index]
  const filename = path.join(baseDir, primaryFile.filename)
  
  const sidecar = await findSidecar(filename)
  await validateSidecar(entry, baseDir, sidecar)

  log.debug(`Entry ${entry} has sidecar file ${sidecar}`)
  return sidecar
}

const exists = async file => fs.access(file).then(() => true).catch(() => false)

export const createTags = entry => {
  const tags = entry.tags || []
  return {
    'XMP-dc:Subject': tags,
    'XMP-digiKam:TagsList': tags,
    'XMP-lr:HierarchicalSubject': tags
  }
}

const emptyTags = createTags({tags: []})

const pick = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)))

const writeableTags = [
  'XMP-dc:Subject',
  'XMP-digiKam:TagsList',
  'XMP-lr:HierarchicalSubject',
]

const getWriteableTags = tags => pick(tags, writeableTags)

export const mergeTags = (orig, other = {}) => {
  return {
    ...getWriteableTags(orig),
    ...other
  }
}

export const isSame = (a, b) => {
  try {
    assert.deepEqual(a, b)
    return true
  } catch (e) {
    return false
  }
}

export const hasWriteableTags = (tags) => !isSame(tags, emptyTags)

const createSidecar = async (entryTags, sidecar, exiftool, dryRun) => {
  if (!hasWriteableTags(entryTags)) {
    log.debug(`New meta data is empty. Skip creating empty sidecar`)
    return
  }
  log.info({xmp: {tags: entryTags, type: 'create', dryRun}}, `Creating new sidecar ${sidecar}${dryRun ? ' (dry run)' : ''}`)
  const action = dryRun ? Promise.resolve(sidecar) : exiftool.write(sidecar, entryTags, ['-xmp', '-o'])
  return action
    .then(() => sidecar)
    .catch(err => {
      log.warn(err, `Failed to create new sidecar ${sidecar}: ${err}. Continue`)
    })
}

const updateSidecar = async (entryTags, sidecar, exiftool, dryRun) => {
  const sidecarTags = await exiftool.read(sidecar, ['-G1'])
  const writeableSidecarTags = getWriteableTags(sidecarTags)
  const mergedTags = mergeTags(writeableSidecarTags, entryTags)
  if (isSame(writeableSidecarTags, mergedTags) || !hasWriteableTags(mergedTags)) {
    log.debug(`No updates for sidecar ${sidecar}`)
    return
  }
  log.info({xmp: {tags: mergedTags, prevTags: mergeTags(writeableSidecarTags), type: 'update', dryRun}}, `Updating sidecar ${sidecar}${dryRun ? ' (dry run)' : ''}`)
  const action = dryRun ? Promise.resolve(sidecar) : exiftool.write(sidecar, mergedTags, ['-overwrite_original'])
  return action
    .then(() => sidecar)
    .catch(err => {
      log.warn(err, `Failed to update sidecar ${sidecar}: ${err}. Continue`)
    })
}

const writeSidecar = async (entry, rootMap, exiftool, dryRun) => {
  const entryTags = createTags(entry)

  const sidecar = await findEntrySidecar(entry, rootMap)
  const hasFile = await exists(sidecar)
  if (!hasFile) {
    return createSidecar(entryTags, sidecar, exiftool, dryRun)
  } else {
    return updateSidecar(entryTags, sidecar, exiftool, dryRun)
  }
}

export const createMetadataWriter = (rootMap, dryRun) => {
  const exiftool = new ExifTool({taskTimeoutMillis: 5000})

  const endExiftool = cb => {
    exiftool.end().then(cb)
      .catch(err => {
        log.warn(err, `Failed to stop exiftool: ${err}`)
        cb()
      })
  }

  return through((entry, _, cb) => {
    writeSidecar(entry, rootMap, exiftool, dryRun)
      .then(sidecar => cb(null, sidecar))
      .catch(err => {
        if (err.code == 'ENEWXMP' || err.code == 'EXMPCHG') {
          log.warn(err, `${err}. Please run import to fix it and rerun export`)
          return cb()
        }
        cb(err)
      })
  }, endExiftool)
}
